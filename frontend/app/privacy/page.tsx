export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6 text-foreground">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: July 2026</p>
      
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p className="text-sm leading-relaxed">
          ClipScheduler collects basic profile information (such as user ID and account handle) when you authorize social media connections to allow scheduling and posting of video content.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Use of Information</h2>
        <p className="text-sm leading-relaxed">
          Your account token and profile details are used strictly to publish videos on your authorized social channels and display scheduling analytics within your dashboard.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Data Deletion</h2>
        <p className="text-sm leading-relaxed">
          You can disconnect your connected accounts at any time from your Accounts dashboard, which immediately revokes all access tokens and removes stored account credentials.
        </p>
      </section>
    </div>
  );
}
