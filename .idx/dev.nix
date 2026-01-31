{ pkgs, ... }: {
  # See https://www.jetpack.io/devbox/docs/configuration/
  packages = [
    pkgs.nodejs_20
    pkgs.google-cloud-sdk
    pkgs.firebase-tools
    pkgs.ffmpeg
  ];
  # See https://www.jetpack.io/devbox/docs/guide/services/
  services = {
  };
  # See https://www.jetpack.io/devbox/docs/configuration/#ports
  ports = [{
    port = 3000;
    name = "Web app";
    description = "The port for the web app";
  }, {
    port = 4000;
    name = "Emulator UI";
    description = "The port for the Firebase emulator UI";
  }, {
    port = 8080;
    name = "Firestore emulator";
    description = "The port for the Firestore emulator";
  }];

  idx = {
    # See https://developers.google.com/idx/guides/customize-idx-env
    extensions = [
      "dbaeumer.vscode-eslint"
    ];
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        npm-install = "npm install && npm --prefix functions install";
      };
      # Runs every time the workspace is (re)started
      onStart = {
        start-emulators = "firebase emulators:start --import=./firebase-export --export-on-exit &"
        dev = "npm run dev"
      };
    };
    # Enable previews and define ports to preview
    previews = {
      enable = true;
      previews = [{
        port = 3000;
        id = "web";
        manager = "web";
      },
      {
        port = 4000;
        id = "emulator";
        manager = "web";
      }
      ];
    };
  };
}