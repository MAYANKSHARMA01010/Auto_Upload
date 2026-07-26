"""
Connected Accounts API — OAuth initiation, callback, list, and disconnect.
"""
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.integrations import OAUTH_URL_GENERATORS
from app.models.activity_log import ActivityAction
from app.models.connected_account import ConnectedAccount
from app.models.scheduled_post import Platform
from app.models.user import User
from app.schemas.account import ConnectedAccountResponse, OAuthInitResponse
from app.services.activity_log_service import ActivityLogService

from app.core.cache import cache_service

router = APIRouter(prefix="/accounts", tags=["Connected Accounts"])


@router.get("", response_model=list[ConnectedAccountResponse])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all connected platform accounts for the current user (with Cache)."""
    cache_key = f"user_accounts:{current_user.id}"
    cached_data = await cache_service.get(cache_key)
    if cached_data is not None:
        return [ConnectedAccountResponse.model_validate(a) for a in cached_data]

    result = await db.execute(
        select(ConnectedAccount).where(ConnectedAccount.user_id == current_user.id)
    )
    accounts = result.scalars().all()
    response_data = [ConnectedAccountResponse.model_validate(a).model_dump(mode="json") for a in accounts]
    await cache_service.set(cache_key, response_data, ttl_seconds=300)
    return [ConnectedAccountResponse.model_validate(a) for a in accounts]


@router.post("/sync", status_code=200)
async def sync_account_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Backfill missing handle and email for existing YouTube connected accounts
    by re-querying the YouTube API and Google userinfo endpoint using the stored access token.
    """
    import httpx

    # Fetch all YouTube and Instagram connected accounts
    result = await db.execute(
        select(ConnectedAccount).where(
            ConnectedAccount.user_id == current_user.id,
            ConnectedAccount.platform.in_([Platform.YOUTUBE, Platform.INSTAGRAM]),
        )
    )
    accounts = result.scalars().all()
    updated = 0

    async with httpx.AsyncClient() as client:
        for acc in accounts:
            if not acc.access_token:
                continue

            changed = False

            if acc.platform == Platform.YOUTUBE:
                # Fetch Google email if missing
                if not acc.email:
                    try:
                        uinfo = await client.get(
                            "https://www.googleapis.com/oauth2/v2/userinfo",
                            headers={"Authorization": f"Bearer {acc.access_token}"},
                            timeout=5,
                        )
                        if uinfo.status_code == 200:
                            email = uinfo.json().get("email", "")
                            if email:
                                acc.email = email
                                changed = True
                    except Exception:
                        pass

                # Fetch handle + channel title if missing
                if not acc.handle:
                    try:
                        ch_resp = await client.get(
                            "https://www.googleapis.com/youtube/v3/channels",
                            headers={"Authorization": f"Bearer {acc.access_token}"},
                            params={"part": "snippet", "mine": "true"},
                            timeout=10,
                        )
                        if ch_resp.status_code == 200:
                            ch_items = ch_resp.json().get("items", [])
                            if ch_items:
                                snip = ch_items[0].get("snippet", {})
                                ch_title = snip.get("title", "")
                                custom_url = snip.get("customUrl", "")
                                if ch_title and (not acc.username or acc.username == "YouTube Channel"):
                                    acc.username = ch_title
                                    changed = True
                                if custom_url:
                                    acc.handle = f"@{custom_url.lstrip('@')}"
                                    changed = True
                    except Exception:
                        pass

            elif acc.platform == Platform.INSTAGRAM:
                if not acc.handle or "Instagram (" in (acc.username or ""):
                    for endpoint_url, ep_params in [
                        ("https://graph.instagram.com/v19.0/me", {"fields": "id,username", "access_token": acc.access_token}),
                        ("https://graph.instagram.com/me", {"fields": "id,username", "access_token": acc.access_token}),
                        ("https://graph.facebook.com/v19.0/me", {"fields": "id,username,name", "access_token": acc.access_token}),
                    ]:
                        try:
                            profile_resp = await client.get(endpoint_url, params=ep_params, timeout=10)
                            if profile_resp.status_code == 200:
                                pdata = profile_resp.json()
                                ig_username = pdata.get("username", "") or pdata.get("name", "")
                                if ig_username:
                                    acc.username = ig_username
                                    acc.handle = f"@{ig_username.lstrip('@')}"
                                    changed = True
                                    break
                        except Exception:
                            pass

            if changed:
                updated += 1

    if updated > 0:
        await db.commit()
        # Invalidate cache so next list_accounts returns fresh data
        await cache_service.delete_pattern(f"user_accounts:{current_user.id}")

    return {"synced": updated, "total": len(accounts)}


@router.patch("/{account_id}", response_model=ConnectedAccountResponse)
async def update_account(
    account_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update account username or handle manually if needed."""
    result = await db.execute(
        select(ConnectedAccount).where(
            ConnectedAccount.id == account_id,
            ConnectedAccount.user_id == current_user.id,
        )
    )
    account = result.scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if "username" in payload:
        account.username = payload["username"]
    if "handle" in payload:
        raw_h = payload["handle"].strip()
        account.handle = f"@{raw_h.lstrip('@')}" if raw_h else None

    await db.commit()
    await db.refresh(account)
    await cache_service.delete_pattern(f"user_accounts:{current_user.id}")
    return account


@router.get("/oauth/{platform}/init", response_model=OAuthInitResponse)
async def init_oauth(
    platform: Platform,
    current_user: User = Depends(get_current_user),
):
    """Generate the OAuth authorization URL for a platform."""
    generator = OAUTH_URL_GENERATORS.get(platform)
    if not generator:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No OAuth configured for platform: {platform}",
        )
    state = secrets.token_urlsafe(32)
    auth_url = generator(state)
    return OAuthInitResponse(authorization_url=auth_url, state=state)


from fastapi.responses import RedirectResponse
import httpx
from app.core.config import settings

@router.get("/oauth/{platform}/callback")
async def oauth_callback(
    platform: Platform,
    code: str = Query(...),
    state: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth Callback endpoint — exchanges code for access token, connects account, and redirects to frontend.
    """
    frontend_base = settings.FRONTEND_URL.rstrip("/")
    redirect_target = f"{frontend_base}/accounts?connected={platform.value}&status=success"

    try:
        # Find first active user (or default user) for local/ngrok development
        user_res = await db.execute(select(User).limit(1))
        user = user_res.scalar_one_or_none()
        if not user:
            return RedirectResponse(url=f"{frontend_base}/login?error=no_user")

        access_token = ""
        refresh_token = ""
        platform_user_id = ""
        username = ""
        handle = ""
        email = ""

        async with httpx.AsyncClient() as client:
            if platform == Platform.YOUTUBE:
                token_resp = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": settings.YOUTUBE_CLIENT_ID,
                        "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": settings.YOUTUBE_REDIRECT_URI,
                    },
                    timeout=15,
                )
                if token_resp.status_code == 200:
                    tdata = token_resp.json()
                    access_token = tdata.get("access_token", "")
                    refresh_token = tdata.get("refresh_token", "")

                    # --- Extract Gmail from id_token (JWT) — works without userinfo scope ---
                    google_email = ""
                    id_token_str = tdata.get("id_token", "")
                    if id_token_str:
                        try:
                            import base64, json as _json
                            # JWT payload is the 2nd segment (base64url encoded)
                            payload_b64 = id_token_str.split(".")[1]
                            # Add padding if needed
                            payload_b64 += "=" * (4 - len(payload_b64) % 4)
                            jwt_payload = _json.loads(base64.urlsafe_b64decode(payload_b64))
                            google_email = jwt_payload.get("email", "")
                        except Exception:
                            pass

                    # Fallback: try userinfo endpoint if id_token email not found
                    if not google_email:
                        try:
                            uinfo = await client.get(
                                "https://www.googleapis.com/oauth2/v2/userinfo",
                                headers={"Authorization": f"Bearer {access_token}"},
                                timeout=5,
                            )
                            if uinfo.status_code == 200:
                                google_email = uinfo.json().get("email", "")
                        except Exception:
                            pass

                    ch_resp = await client.get(
                        "https://www.googleapis.com/youtube/v3/channels",
                        headers={"Authorization": f"Bearer {access_token}"},
                        params={"part": "snippet,brandingSettings", "mine": "true"},
                        timeout=10,
                    )
                    if ch_resp.status_code == 200:
                        ch_items = ch_resp.json().get("items", [])
                        if ch_items:
                            platform_user_id = ch_items[0].get("id", "")
                            snip = ch_items[0].get("snippet", {})
                            username = snip.get("title", "YouTube Channel")
                            custom_url = snip.get("customUrl", "")
                            handle = f"@{custom_url.lstrip('@')}" if custom_url else ""
                            email = google_email

                    # --- Reject if no handle (YouTube channel has no customUrl yet) ---
                    if not handle:
                        return RedirectResponse(
                            url=f"{frontend_base}/accounts?error=no_handle&platform=youtube"
                        )

            elif platform == Platform.INSTAGRAM:
                token_resp = await client.post(
                    "https://api.instagram.com/oauth/access_token",
                    data={
                        "client_id": settings.INSTAGRAM_CLIENT_ID,
                        "client_secret": settings.INSTAGRAM_CLIENT_SECRET,
                        "grant_type": "authorization_code",
                        "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
                        "code": code,
                    },
                    timeout=15,
                )
                print(f"DEBUG IG TOKEN RESP STATUS: {token_resp.status_code}, BODY: {token_resp.text}")
                if token_resp.status_code == 200:
                    tdata = token_resp.json()
                    access_token = str(tdata.get("access_token", ""))
                    platform_user_id = str(tdata.get("user_id", ""))
                    ig_username = tdata.get("username", "")

                    if not ig_username:
                        for test_url, test_params in [
                            ("https://graph.instagram.com/v19.0/me", {"fields": "id,username,account_type", "access_token": access_token}),
                            ("https://graph.instagram.com/me", {"fields": "id,username", "access_token": access_token}),
                        ]:
                            try:
                                profile_resp = await client.get(test_url, params=test_params, timeout=10)
                                if profile_resp.status_code == 200:
                                    pdata = profile_resp.json()
                                    ig_username = pdata.get("username", "") or pdata.get("name", "")
                                    if ig_username:
                                        break
                            except Exception as e:
                                pass

                    username = ig_username or f"Instagram ({platform_user_id[:8]})"
                    handle = f"@{ig_username.lstrip('@')}" if ig_username else ""
                    email = ""

            elif platform == Platform.FACEBOOK:
                token_resp = await client.get(
                    "https://graph.facebook.com/v19.0/oauth/access_token",
                    params={
                        "client_id": settings.FACEBOOK_APP_ID,
                        "client_secret": settings.FACEBOOK_APP_SECRET,
                        "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
                        "code": code,
                    },
                    timeout=15,
                )
                if token_resp.status_code == 200:
                    tdata = token_resp.json()
                    access_token = tdata.get("access_token", "")
                    try:
                        me_resp = await client.get(
                            "https://graph.facebook.com/v19.0/me",
                            params={
                                "fields": "id,name,email,accounts{id,name,access_token,instagram_business_account{id,username,name}}",
                                "access_token": access_token,
                            },
                            timeout=10,
                        )
                        if me_resp.status_code == 200:
                            mdata = me_resp.json()
                            platform_user_id = str(mdata.get("id", ""))
                            username = mdata.get("name", "Facebook Page")
                            email = mdata.get("email", "")

                            # If a linked Instagram Business Account is present, extract its handle
                            accounts_data = mdata.get("accounts", {}).get("data", [])
                            for acc_item in accounts_data:
                                ig_biz = acc_item.get("instagram_business_account", {})
                                if ig_biz and ig_biz.get("username"):
                                    ig_un = ig_biz.get("username")
                                    # Create or update Instagram account as well
                                    ig_stmt = select(ConnectedAccount).where(
                                        ConnectedAccount.user_id == user.id,
                                        ConnectedAccount.platform == Platform.INSTAGRAM,
                                        ConnectedAccount.platform_user_id == str(ig_biz.get("id", "")),
                                    )
                                    ig_existing = (await db.execute(ig_stmt)).scalar_one_or_none()
                                    if ig_existing:
                                        ig_existing.access_token = acc_item.get("access_token", access_token)
                                        ig_existing.username = ig_un
                                        ig_existing.handle = f"@{ig_un.lstrip('@')}"
                                    else:
                                        db.add(ConnectedAccount(
                                            user_id=user.id,
                                            platform=Platform.INSTAGRAM,
                                            platform_user_id=str(ig_biz.get("id", "")),
                                            username=ig_un,
                                            handle=f"@{ig_un.lstrip('@')}",
                                            access_token=acc_item.get("access_token", access_token),
                                            is_active=True,
                                        ))
                                    break
                    except Exception as e:
                        print(f"DEBUG FB ME FETCH ERROR: {e}")

            elif platform == Platform.THREADS:
                token_resp = await client.post(
                    "https://graph.threads.net/oauth/access_token",
                    data={
                        "client_id": settings.THREADS_CLIENT_ID,
                        "client_secret": settings.THREADS_CLIENT_SECRET,
                        "grant_type": "authorization_code",
                        "redirect_uri": settings.THREADS_REDIRECT_URI,
                        "code": code,
                    },
                    timeout=15,
                )
                if token_resp.status_code == 200:
                    tdata = token_resp.json()
                    access_token = tdata.get("access_token", "")
                    username = "Threads User"

            elif platform == Platform.X:
                token_resp = await client.post(
                    "https://api.twitter.com/2/oauth2/token",
                    data={
                        "client_id": settings.X_API_KEY,
                        "grant_type": "authorization_code",
                        "code": code,
                        "redirect_uri": settings.X_REDIRECT_URI,
                        "code_verifier": "challenge",
                    },
                    timeout=15,
                )
                if token_resp.status_code == 200:
                    tdata = token_resp.json()
                    access_token = tdata.get("access_token", "")
                    username = "Twitter / X User"

        # Check existing connected account matching user_id + platform + (platform_user_id or username)
        # This enables connecting MULTIPLE different accounts/channels for the SAME platform!
        target_pid = platform_user_id or secrets.token_hex(8)
        
        acc_stmt = select(ConnectedAccount).where(
            ConnectedAccount.user_id == user.id,
            ConnectedAccount.platform == platform,
            ConnectedAccount.platform_user_id == platform_user_id if platform_user_id else ConnectedAccount.username == username,
        )
        acc_res = await db.execute(acc_stmt)
        existing_acc = acc_res.scalar_one_or_none()

        if existing_acc:
            existing_acc.access_token = access_token or code
            if refresh_token:
                existing_acc.refresh_token = refresh_token
            existing_acc.username = username or existing_acc.username or platform.value
            if handle:
                existing_acc.handle = handle
            if email:
                existing_acc.email = email
            existing_acc.is_active = True
        else:
            new_acc = ConnectedAccount(
                user_id=user.id,
                platform=platform,
                platform_user_id=target_pid,
                username=username or f"{platform.value.capitalize()} Account",
                handle=handle or None,
                email=email or None,
                access_token=access_token or code,
                refresh_token=refresh_token or "",
                is_active=True,
            )
            db.add(new_acc)

        await db.commit()

        # Invalidate cache
        await cache_service.delete_pattern(f"user_accounts:{user.id}")

        await ActivityLogService.log(
            db,
            user_id=user.id,
            action=ActivityAction.ACCOUNT_CONNECTED,
            description=f"{platform.value.capitalize()} account connected successfully",
            resource_type="connected_account",
        )

    except Exception as e:
        print(f"OAuth Callback Error for {platform}: {e}")

    return RedirectResponse(url=redirect_target)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect a platform account."""
    result = await db.execute(
        select(ConnectedAccount).where(
            ConnectedAccount.id == account_id,
            ConnectedAccount.user_id == current_user.id,
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    platform_name = account.platform.value
    await db.delete(account)
    await db.commit()

    # Invalidate account list cache
    await cache_service.delete(f"user_accounts:{current_user.id}")

    await ActivityLogService.log(
        db,
        user_id=current_user.id,
        action=ActivityAction.ACCOUNT_DISCONNECTED,
        description=f"{platform_name} account disconnected",
        resource_type="connected_account",
        resource_id=str(account_id),
    )
