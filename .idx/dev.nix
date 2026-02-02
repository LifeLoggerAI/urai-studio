
{ pkgs, ... }: {
  # Use the stable Nix channel for reproducibility. This ensures that the same
  # package versions are used every time the workspace is created.
  channel = "stable-24.05";

  # A list of packages to install from the specified channel. These packages
  # will be available in the development environment's shell.
  packages = [
    pkgs.nodejs_20      # The required Node.js version for the project.
    pkgs.firebase-tools # Provides the Firebase CLI for deployment and emulation.
    pkgs.ffmpeg         # A dependency for media processing, used by the job pipeline.
  ];

  # VS Code extensions to install from the Open VSX Registry. These extensions
  # enhance the development experience within the IDE.
  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"    # For real-time linting of JavaScript and TypeScript.
      "esbenp.prettier-vscode"    # To automatically format code on save.
      "bradlc.vscode-tailwindcss" # For Tailwind CSS autocompletion and linting.
      "Firebase.firebase-vscode"  # For better integration with Firebase services.
    ];
    workspace = {
      # The onStart hook runs commands every time the workspace is (re)started.
      onStart = {
        # Enable corepack for pnpm support.
        enable-corepack = "corepack enable";
        # Prepare pnpm version.
        prepare-pnpm = "corepack prepare pnpm@9.15.0 --activate";
      };
    };
  };
}
