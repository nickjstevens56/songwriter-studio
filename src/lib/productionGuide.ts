export type ChecklistStep = {
  id: string;
  label: string;
  detail: string;
};

export type GuideSection = {
  id: string;
  title: string;
  intro: string;
  steps: ChecklistStep[];
};

export type Stage = {
  key: "recording" | "mixing" | "mastering";
  label: string;
  tagline: string;
  color: string;
  sections: GuideSection[];
};

export const PRODUCTION_STAGES: Stage[] = [
  {
    key: "recording",
    label: "Recording",
    tagline: "Capture the best possible signal before you touch a plugin.",
    color: "sky",
    sections: [
      {
        id: "rec-environment",
        title: "Acoustic environment",
        intro: "Your room shapes your recording more than your microphone does.",
        steps: [
          { id: "rec-env-1", label: "Treat flutter echo and slap", detail: "Clap once in your room. If you hear a ringy, repeating echo, you have flutter echo. Hang thick curtains, bookshelves, or moving blankets on parallel walls. You don't need foam tiles — mass and diffusion matter more." },
          { id: "rec-env-2", label: "Record away from corners", detail: "Low frequencies stack up in corners. Place your instrument and mic at least 1–2 feet away from walls and corners for a flatter, more neutral capture." },
          { id: "rec-env-3", label: "Check for HVAC noise", detail: "Turn off air conditioning and heating before tracking vocals or acoustic instruments. Listen for hum, hiss, or rumble in a silent room with your mic gain up." },
          { id: "rec-env-4", label: "Minimize room reflections on vocals", detail: "Record vocals in a small, dead space — a closet full of clothes, a corner with a reflection filter, or with a duvet behind you. Dry recordings are infinitely easier to mix." },
        ],
      },
      {
        id: "rec-signal",
        title: "Signal chain & gain staging",
        intro: "Get the level right from the source. Fix it in the mix — not in post.",
        steps: [
          { id: "rec-sig-1", label: "Set preamp gain for peaks around -12 dBFS", detail: "Aim for peaks hitting around -12 to -18 dBFS on your DAW's input meter. This gives headroom for dynamics without risking digital clipping. You can always add volume later; you can't undo distortion." },
          { id: "rec-sig-2", label: "Check for ground hum and cable issues", detail: "Before every session, listen to each channel with nothing playing. A 60Hz hum usually means a ground loop — try a different outlet or a DI box. A high-pitched whine may be a bad cable." },
          { id: "rec-sig-3", label: "Use a pop filter on vocals", detail: "Position a pop filter 2–3 inches from the mic capsule. Plosives (P, B sounds) that clip or thud can't be fixed later." },
          { id: "rec-sig-4", label: "Set sample rate and bit depth before tracking", detail: "Record at 24-bit / 44.1kHz minimum. 48kHz if you're delivering for sync or video. Higher sample rates don't hurt but won't make your music sound better to listeners." },
        ],
      },
      {
        id: "rec-performance",
        title: "Performance & takes",
        intro: "A great performance with a mediocre mic beats a mediocre performance with a great mic every time.",
        steps: [
          { id: "rec-perf-1", label: "Record more takes than you think you need", detail: "Capture at least 3 full takes of every vocal and lead instrument part. You'll build your best performance from a comp (composite of the best moments across takes)." },
          { id: "rec-perf-2", label: "Give the performer a good headphone mix", detail: "A performer who can hear themselves clearly will perform better and stay in tune. Put some reverb in the headphone mix only — it doesn't go to the recording and helps them relax." },
          { id: "rec-perf-3", label: "Record to a click or reference tempo", detail: "Even if you plan a loose, human feel, record to a tempo map. It makes editing, aligning, and mixing infinitely easier. You can always add timing variation in post." },
          { id: "rec-perf-4", label: "Name and organize your files as you go", detail: "Use a consistent naming convention: [ProjectName]_[Instrument]_[Take].wav. Disorganized sessions cost hours at mix time." },
          { id: "rec-perf-5", label: "Capture scratch tracks for reference", detail: "Record a rough scratch vocal and guitar/piano from day one. It captures the emotional intent of the song, which gets refined away during editing. Refer back to it." },
        ],
      },
    ],
  },
  {
    key: "mixing",
    label: "Mixing",
    tagline: "Make every element sit in its place and serve the song.",
    color: "violet",
    sections: [
      {
        id: "mix-prep",
        title: "Session prep",
        intro: "Organize before you reach for a single plugin.",
        steps: [
          { id: "mix-prep-1", label: "Consolidate and label all regions", detail: "Every track should have one clean audio region from start to finish, properly trimmed and faded. Delete unused takes and muted clips." },
          { id: "mix-prep-2", label: "Color-code your tracks by instrument group", detail: "Drums, bass, guitars, keys, vocals — each group gets its own color. You'll navigate 30+ tracks in seconds once your eyes know where to look." },
          { id: "mix-prep-3", label: "Set initial gain staging — all faders at unity", detail: "Before any EQ or compression, balance your tracks with just the faders and pan. Aim for a rough mix that peaks around -6 dBFS on the master bus. This is your starting point." },
          { id: "mix-prep-4", label: "Load a reference track", detail: "Pick 2–3 commercially released songs with a similar sound or vibe. A/B between your mix and these references throughout. Your ears adjust to your own session — references keep you honest." },
        ],
      },
      {
        id: "mix-eq",
        title: "EQ",
        intro: "Carve space for each element — subtraction first, addition second.",
        steps: [
          { id: "mix-eq-1", label: "High-pass everything that doesn't need low end", detail: "Guitars, synths, acoustic instruments, and especially room mics almost always benefit from a high-pass filter at 80–120Hz. This clears mud from the low end without affecting the perceived tone." },
          { id: "mix-eq-2", label: "Find and cut problem frequencies first", detail: "Solo each track and sweep a narrow boost to find harsh, honky, or boomy spots. Then cut those — usually 2–5 dB is enough. Subtractive EQ sounds more natural than additive." },
          { id: "mix-eq-3", label: "Create separation between similar elements", detail: "If kick and bass are fighting, decide which one owns the deep sub (below 80Hz) and roll off the other there. Same for mid-range instruments: guitars and vocals often clash around 2–4kHz." },
          { id: "mix-eq-4", label: "Add air to vocals and cymbals sparingly", detail: "A gentle shelf boost above 10–12kHz can add sparkle. Use a high-quality EQ and keep it subtle — 1–3 dB. More than that sounds artificial." },
        ],
      },
      {
        id: "mix-compression",
        title: "Compression",
        intro: "Control dynamics to create energy, punch, and glue.",
        steps: [
          { id: "mix-comp-1", label: "Understand what you're trying to fix before compressing", detail: "Compression tames peaks, adds sustain, or glues elements together — but not all at once. Know your goal before reaching for the ratio and threshold." },
          { id: "mix-comp-2", label: "Set attack slow enough to let transients through", detail: "For punch and impact (drums, guitars), use a slower attack (15–40ms) so the initial hit passes unaffected. Fast attack (1–5ms) smooths out transients — right for leveling vocals, wrong for drums." },
          { id: "mix-comp-3", label: "Use parallel (New York) compression on drums", detail: "Blend a heavily compressed version of your drum bus with the uncompressed signal. You get sustain and fatness without losing the snap of the original hits." },
          { id: "mix-comp-4", label: "Don't over-compress your 2-bus during mixing", detail: "A gentle glue compressor on the master bus (1–2 dB of gain reduction, slow attack/release) is fine. Heavy 2-bus compression while mixing is a trap — it masks problems and leaves no headroom for the mastering engineer." },
        ],
      },
      {
        id: "mix-space",
        title: "Space, width & depth",
        intro: "Place sounds in a three-dimensional field — left/right, front/back, up/down.",
        steps: [
          { id: "mix-space-1", label: "Pan deliberately — mono center for the foundation", detail: "Kick, snare, bass, and lead vocal almost always live at center. Everything else can spread: guitars and pads wide, backing vocals slightly off-center, overhead mics hard L/R." },
          { id: "mix-space-2", label: "Use pre-delay on reverb to preserve clarity", detail: "Adding 10–30ms of pre-delay before a reverb tail keeps the dry signal clear and present. Without it, reverb smears the attack of your sounds and muddies the mix." },
          { id: "mix-space-3", label: "Check your mix in mono", detail: "Fold your mix to mono and listen. If elements disappear or the low end collapses, you have phase issues. A mix that sounds good in mono will translate everywhere." },
          { id: "mix-space-4", label: "Automate reverb and effects sends", detail: "A constant reverb level throughout the song becomes wallpaper. Automate sends to increase reverb on verse vocals for intimacy, then pull it back on the chorus where you want presence." },
        ],
      },
      {
        id: "mix-final",
        title: "Final checks",
        intro: "Before you export, listen the way your audience will.",
        steps: [
          { id: "mix-final-1", label: "Listen on at least three different playback systems", detail: "Headphones, studio monitors, a Bluetooth speaker, and car speakers. Each reveals different problems. If it sounds good everywhere, it's done." },
          { id: "mix-final-2", label: "Take a break before your final listen", detail: "After 3+ hours in a session, your ears are fatigued and biased. Sleep on it. A fresh listen the next morning catches things you'll miss at hour four." },
          { id: "mix-final-3", label: "Export stems as well as your stereo mix", detail: "Export at 24-bit WAV. Keep your session files. If you ever hire a mastering engineer or want to remix a track, stems are invaluable." },
        ],
      },
    ],
  },
  {
    key: "mastering",
    label: "Mastering",
    tagline: "Prepare your mix for the world — consistent, loud enough, and format-ready.",
    color: "emerald",
    sections: [
      {
        id: "mast-understand",
        title: "What mastering actually is",
        intro: "Mastering is the final quality control step — not a way to fix a bad mix.",
        steps: [
          { id: "mast-und-1", label: "Understand the mastering engineer's role", detail: "A mastering engineer listens to your mix on calibrated, full-range monitors in an acoustically treated room, makes surgical EQ and dynamic adjustments, and ensures the final master translates consistently across formats and platforms." },
          { id: "mast-und-2", label: "Know when to hire out vs. DIY", detail: "If budget allows, hire a mastering engineer for anything you're releasing commercially. They bring fresh ears and a neutral room. DIY mastering is fine for demos, reference mixes, and learning — but harder to do objectively on your own work." },
          { id: "mast-und-3", label: "Fix mix problems before mastering", detail: "If your mix is too dull, too harsh, or too muddy, mastering won't fix it. Return to the mix session. Mastering can polish; it cannot repair." },
        ],
      },
      {
        id: "mast-process",
        title: "The mastering chain",
        intro: "The order matters: EQ → compression → limiting → loudness.",
        steps: [
          { id: "mast-proc-1", label: "Start with broadband EQ adjustments", detail: "Listen to your mix against a reference. Is it too dark? Boost a gentle shelf above 8kHz. Too much low-mid buildup? Find the frequency (usually 200–400Hz) and cut subtly. Less than 3 dB of change is usually enough." },
          { id: "mast-proc-2", label: "Apply multiband or broadband compression for cohesion", detail: "A slow, gentle bus compressor (1–3 dB GR, 50–100ms attack, 200–400ms release) glues the low, mid, and high frequencies together. This is the 'glue' step, not a loudness step." },
          { id: "mast-proc-3", label: "Use a true peak limiter as your final stage", detail: "A brickwall limiter raises loudness while preventing digital clipping. Set your true peak ceiling at -1.0 dBTP for streaming (most platforms). Avoid pushing so hard that the limiter is working constantly — that's audible distortion." },
          { id: "mast-proc-4", label: "Apply stereo width enhancement carefully", detail: "Mid-side processing can add width to the sides without touching the mono-compatible center. Be subtle and always check in mono — if your mix gets thin in mono, you've gone too far." },
        ],
      },
      {
        id: "mast-loudness",
        title: "Loudness targets by platform",
        intro: "Streaming platforms normalize loudness — making your music louder than -14 LUFS won't make it play louder.",
        steps: [
          { id: "mast-loud-1", label: "Spotify: target -14 LUFS integrated", detail: "Spotify normalizes to -14 LUFS. Masters louder than this get turned down; masters quieter get turned up. Target -14 LUFS for the best result. Don't sacrifice dynamic range chasing loudness." },
          { id: "mast-loud-2", label: "Apple Music: target -16 LUFS integrated", detail: "Apple Music normalizes to -16 LUFS. If you're delivering the same master to Apple and Spotify, -14 LUFS is a safe compromise — Apple will turn it down slightly." },
          { id: "mast-loud-3", label: "YouTube: target -14 LUFS integrated", detail: "YouTube normalizes to -14 LUFS. Same target as Spotify. For music videos where dynamics matter, even quieter (-16 to -18 LUFS) often sounds better before normalization." },
          { id: "mast-loud-4", label: "CD / download: -12 to -9 LUFS (if desired)", detail: "Physical CDs and direct downloads aren't normalized. If you're pressing vinyl or selling high-res downloads, you can be slightly louder — but don't sacrifice dynamics for the sake of it." },
        ],
      },
      {
        id: "mast-delivery",
        title: "Delivery & formats",
        intro: "Get your files ready for distribution in the right format, the first time.",
        steps: [
          { id: "mast-del-1", label: "Export 24-bit / 44.1kHz WAV for distribution", detail: "This is the standard delivery format for most distributors (DistroKid, TuneCore, CD Baby). Don't deliver MP3s — the distributor will encode to MP3 and AAC from your WAV." },
          { id: "mast-del-2", label: "Export a separate 16-bit / 44.1kHz WAV for CD", detail: "If you're pressing CDs or delivering to a mastering house for CD replication, they need 16-bit files. Use dithering when downsampling from 24-bit to 16-bit." },
          { id: "mast-del-3", label: "Embed metadata in your master files", detail: "ISRC codes, track title, artist name, album name, copyright year. Your distributor will ask for most of this, but embedding it in the file itself is good practice for licensing and sync." },
          { id: "mast-del-4", label: "Archive your unmastered mix and session files", detail: "Never delete your pre-master mix. Technology changes — mastering formats that didn't exist today may become standard. Your unmastered 24-bit mix is your source of truth." },
        ],
      },
    ],
  },
];
