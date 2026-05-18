{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.git
    pkgs.openssl
  ];

  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "Firebase.firebase-vscode"
    ];

    workspace = {
      onCreate = {
        setup = ''
          set -e
          corepack enable || true
          corepack prepare pnpm@9.7.0 --activate || npm i -g pnpm@9.7.0
          echo "Firebase Studio environment ready."
        '';
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          command = [
            "bash"
            "-lc"
            "corepack enable || true; corepack prepare pnpm@9.7.0 --activate || true; pnpm -C apps/studio dev -- --hostname 0.0.0.0 --port $PORT"
          ];
          manager = "web";
        };
      };
    };
  };
}
