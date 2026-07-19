export default function DashboardPage() {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-clg space-y-gutter">
        {/* Metrics Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <div className="glass p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary">visibility</span>
              <span className="text-primary font-mono-sm">+12.5%</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md">Total Views</p>
              <p className="font-headline-md text-headline-md mt-cxs">2.4M</p>
            </div>
          </div>
          <div className="glass p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-secondary">schedule_send</span>
              <span className="text-secondary font-mono-sm">Active</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md">Scheduled Posts</p>
              <p className="font-headline-md text-headline-md mt-cxs">48</p>
            </div>
          </div>
          <div className="glass p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-tertiary">hub</span>
              <span className="text-tertiary font-mono-sm">6/10</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md">Connected Accounts</p>
              <p className="font-headline-md text-headline-md mt-cxs">YouTube, IG, TT</p>
            </div>
          </div>
          <div className="glass p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-on-surface-variant">database</span>
              <span className="text-on-surface-variant font-mono-sm">82% Full</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md">Storage Used</p>
              <p className="font-headline-md text-headline-md mt-cxs">412 GB</p>
            </div>
          </div>
        </section>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
          {/* Upcoming Posts (Styling inspired by calendar view) */}
          <section className="xl:col-span-8">
            <div className="flex items-center justify-between mb-cmd">
              <h2 className="font-headline-lg text-headline-lg">Upcoming Posts</h2>
              <button className="text-primary text-label-md hover:underline">View Calendar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-cmd">
              <div className="glass p-csm rounded-xl group cursor-pointer hover:border-primary/50 transition-all">
                <div className="relative rounded-lg overflow-hidden h-40">
                  <img className="w-full h-full object-cover" data-alt="A cinematic video thumbnail of a tech reviewer holding a sleek futuristic smartphone in a neon-lit studio. The composition is dynamic with shallow depth of field, vibrant purple and blue backlight, and high-contrast professional lighting. Enterprise-grade color grading with sharp details on the product's glass surface." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn_pe4lRIbjIMJ9iUEtwXwrAjHNn4qviA0VzbhCKXj-QAUbWaoIR0_lrI6AtG3P0BpPu_ag09vVqaRV5r9NO0l2VGa4zFE-vXvyvwACXHp0h_lmXx6CZQwkpdvjwQofDCq4ER5cfHRtIRizmP-Ct-jBCqI5jcu34V_2Ri_v54-Zi64TPh2DPQedlBTuf2f-ujB7XqN47P6QCqREMedreooC7T-qI8t0GLd_kRp4gz4OzU172rdymNTtGGZ8U3y1w8XQtkEQNYeQso" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-xs left-xs flex items-center gap-cxs">
                    <div className="bg-red-600 rounded p-1 flex items-center justify-center">
                      <img alt="YT" className="w-3 h-3 invert grayscale brightness-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVMHpk-JmvLmV2LKEQzc5ErLCpslzsGB4_yTLPviw3aRPZd-sj5okJpOegp2b7Prah1J1Wo1EBU_E8Gc9SfXP18hI2vMTN60z0Z81zjd4keFLptEikiHX3ItEIx4kIfaxHJHaxnY7CLPIaK3LZF1v9IOL5vOKFt-nxJwqCzkwQEOO2BxI8ygDWHsK66a2c18UG1hlJo4EDIwiHj5aavDAgaAE_zOlJyPMMPrwKez2hLLiJOwWJv_TP021McE0jJY4ijDsxXbd3dUo" />
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">YouTube</span>
                  </div>
                  <div className="absolute top-xs right-xs bg-black/50 backdrop-blur-md px-cxs py-[2px] rounded text-[10px] font-mono-sm text-white">12:45</div>
                </div>
                <div className="mt-csm">
                  <h3 className="font-body-md font-semibold text-on-surface line-clamp-1">Next-Gen Tech Review: The Future is Now</h3>
                  <div className="flex items-center justify-between mt-cxs">
                    <p className="text-label-md text-on-surface-variant">Tomorrow, 10:00 AM</p>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary">more_vert</span>
                  </div>
                </div>
              </div>
              <div className="glass p-csm rounded-xl group cursor-pointer hover:border-primary/50 transition-all">
                <div className="relative rounded-lg overflow-hidden h-40">
                  <img className="w-full h-full object-cover" data-alt="A vertical video thumbnail of a travel vlogger standing on a balcony overlooking a foggy Tokyo cityscape at dusk. Soft orange city lights contrast with the cool blue mist. The image has a moody, high-end lifestyle aesthetic with elegant typography overlays implied but not present. Professional cinema-style color palette." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIkjua6LTalRI_-GhnDOtf6rd3HmE9N8ZQVS407wjUMae1LS0FQn2TPukv3BCCSeoiyHVVZSlC9M3VSrv_4FMs56Ckm_Yvgjp8M7q8L1T7vHqa6Jc4K9UGPwsa5lrnwuiz3oWRplX5mmJfHDedPAVaBuIIVkvB3yoyPlBX2ibLaumTiUY0xvYs97DMm7ylMUHy8r03Dbu4snMgNpIMHqF8Qlx7vx0ZYb6o2KCE4VmTiC54JpI2YUU3AAisHZ3cLv0iao1QbUPoIw0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-xs left-xs flex items-center gap-cxs">
                    <div className="bg-black border border-white/20 rounded p-1 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] text-white">videocam</span>
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">TikTok</span>
                  </div>
                  <div className="absolute top-xs right-xs bg-black/50 backdrop-blur-md px-cxs py-[2px] rounded text-[10px] font-mono-sm text-white">00:58</div>
                </div>
                <div className="mt-csm">
                  <h3 className="font-body-md font-semibold text-on-surface line-clamp-1">Tokyo Hidden Gems: 24 Hours in Shibuya</h3>
                  <div className="flex items-center justify-between mt-cxs">
                    <p className="text-label-md text-on-surface-variant">Friday, 5:30 PM</p>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary">more_vert</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Recent Uploads List */}
          <section className="xl:col-span-4">
            <div className="flex items-center justify-between mb-cmd">
              <h2 className="font-headline-lg text-headline-lg">Recent Uploads</h2>
            </div>
            <div className="glass rounded-xl overflow-hidden divide-y divide-outline-variant">
              <div className="p-cmd hover:bg-surface-container-high transition-colors flex items-center gap-cmd">
                <div className="w-12 h-12 rounded bg-surface-container-highest flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img className="w-full h-full object-cover" data-alt="A macro shot of a sleek camera lens with intricate light reflections on the glass surface. High-contrast dark photography with deep blue tones and sharp focus on the mechanical details of the lens housing. Professional studio lighting style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAs8EeEjIj2R1bHG5Y-Ru9hEwup-0nf03NJ4kf9QYK8oJJ_DR74wGmzsnDFdPsI6lRWmRdIoGLi9TzVI53kefeVwaJRpRBVEPpqkHczGnQPSZq9c1Htpgo54IIOki3maYqrFhhi5vs9BNffpcxD81UgWDPKpL54z6awmuffbQN35qI1n7zA5dnfb3oVsGAIDbGegcat-2niKQKFX_GzSOV13CsfnZqi3Oi0JkEEZYAU8Mxv4WfEghYYxzdmxuyQkNSljUL7L4HpVM" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm font-semibold truncate">Vlog_Draft_Final.mp4</p>
                  <p className="text-label-md text-on-surface-variant">Oct 24, 2024</p>
                </div>
                <div className="status-chip bg-surface-container-high text-primary border border-primary/30">Ready</div>
              </div>
              <div className="p-cmd hover:bg-surface-container-high transition-colors flex items-center gap-cmd">
                <div className="w-12 h-12 rounded bg-surface-container-highest flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined animate-spin text-on-surface-variant">autorenew</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm font-semibold truncate">Social_Ad_B_Roll.mov</p>
                  <p className="text-label-md text-on-surface-variant">Oct 24, 2024</p>
                </div>
                <div className="status-chip bg-yellow-500/10 text-yellow-400 border border-yellow-400/30">Processing</div>
              </div>
              <div className="p-cmd hover:bg-surface-container-high transition-colors flex items-center gap-cmd">
                <div className="w-12 h-12 rounded bg-surface-container-highest flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img className="w-full h-full object-cover" data-alt="A minimalist flat-lay of a silver laptop on a dark slate surface, illuminated by a single warm desk lamp light from the side. Clean lines, professional workspace aesthetic, high-key shadows, sophisticated corporate style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNUiUSx92ojCNFnEacNQpfDwK5UwRASoCxpkqb1oiuctV7ypU5bX7s_nGeBNOs3ETefDlugrdzPoRyLJ29o8y0A06Rv8vwaUHIaVduc2kqQIZhTpEs5f2y7P2cAjRYTt9MOAhopF6f5djxWpQV4yshWgeen7BVC9JSf_Hkhnva9yauWgJXfNsDW1lnzjDw27G_XT6rcK5U2DrbJpaSN5TaFySUg5JK-emcKYqHXLow23k67CXg5V58A47Zsaj6O9GHlTBJhtPfrcI" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm font-semibold truncate">Interview_Highlight.mp4</p>
                  <p className="text-label-md text-on-surface-variant">Oct 23, 2024</p>
                </div>
                <div className="status-chip bg-surface-container-high text-primary border border-primary/30">Ready</div>
              </div>
              <div className="p-cmd hover:bg-surface-container-high transition-colors flex items-center gap-cmd">
                <div className="w-12 h-12 rounded bg-surface-container-highest flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-error-container/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-error">error</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm font-semibold truncate">Main_Sponsor_Segment.mp4</p>
                  <p className="text-label-md text-on-surface-variant">Oct 23, 2024</p>
                </div>
                <div className="status-chip bg-error/10 text-error border border-error/30">Failed</div>
              </div>
            </div>
            <button className="w-full mt-cmd py-cxs text-label-md text-on-surface-variant hover:text-primary transition-colors border border-dashed border-outline-variant rounded-xl">View Full History</button>
          </section>
        </div>
      </div>
    </>
  );
}
