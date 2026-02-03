{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.firebase-tools
    pkgs.ffmpeg
    pkgs.pnpm
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
        pnpm-install = "pnpm install";
      };
      onStart = {
        start-emulators = "firebase emulators:start --only auth,firestore,storage,functions,hosting";
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["pnpm" "-C" "apps/studio" "run" "dev" "--" "--port" "$PORT"];
          manager = "web";
        };
      };
    };
  };
}
