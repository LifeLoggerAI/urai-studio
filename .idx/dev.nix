{ pkgs, ... }: {
  # See https://www.jetpack.io/devbox/docs/configuration/
  packages = [
    pkgs.nodejs_20
    pkgs.google-cloud-sdk
    pkgs.firebase-tools
    pkgs.ffmpeg
    pkgs.pnpm
    pkgs.playwright
    pkgs.glib
  ];
  # See https://www.jetpack.io/devbox/docs/guide/services/
  services = {
  };
  # See https://www.jetpack.io/devbox/docs/configuration/#ports
  ports = [{
    port = 3000;
    name = "next-dev";
    description = "Next.js development server";
  }, {
    port = 4000;
    name = "emulator-ui";
    description = "Firebase Emulator UI";
  }];
  idx = {
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["pnpm" "run" "dev"];
          manager = "web";
        };
        emulators = {
          command = ["firebase" "emulators:start" "--import" "./seed" "--export-on-exit"];
          manager = "web";
          port = 4000;
        };
      };
    };
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "bradlc.vscode-tailwindcss"
    ];
    workspace = {
      onCreate = {
        pnpm-install = "cd uraistudio-app && pnpm install --shamefully-hoist && pnpm run install:functions";
      };
    };
  };
}
