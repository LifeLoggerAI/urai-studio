{ pkgs, ... }: {
  channel = "stable-24.05";

  # Keep the Nix layer tiny and stable. Firebase Studio was failing during
  # environment build when CLI packages were resolved directly through Nix.
  # Node 20 is provided here; pnpm/firebase-tools are activated in onCreate.
  packages = [
    pkgs.nodejs_20
    pkgs.git
    pkgs.openssl
    pkgs.ffmpeg
    pkgs.rsync
  ];

  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "bradlc.vscode-tailwindcss"
      "Firebase.firebase-vscode"
    ];

    workspace = {
      onCreate = {
        setup = ''
          set -e
          corepack enable || true
          corepack prepare pnpm@9.7.0 --activate || npm i -g pnpm@9.7.0
          pnpm install --no-frozen-lockfile
          npx -y firebase-tools@13 --version
        '';
      };
      # Do not auto-start emulators on workspace boot. Long-running emulator
      # processes can make Firebase Studio look stuck during initialization.
    };

    previews = {
      enable = true;
      previews = {
        web = {
          command = ["bash" "-lc" "corepack enable || true; pnpm -C apps/studio dev -- --hostname 0.0.0.0 --port $PORT"];
          manager = "web";
        };
      };
    };
  };
}
