{ pkgs, ... }: {
  # Use the stable Nix channel for reproducibility. This ensures that the same
  # package versions are used every time the workspace is created.
  channel = "stable-24.05";

  # A list of packages to install from the specified channel. These packages
  # will be available in the development environment's shell.
  packages = [
    pkgs.nodejs_20      # The required Node.js version for the project.
    pkgs.pnpm           # The package manager used in the monorepo.
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

    # Workspace lifecycle hooks to automate setup and startup tasks.
    workspace = {
      # The 'onCreate' hook runs only when the workspace is first created.
      # It's used here to install all pnpm dependencies automatically.
      onCreate = {
        install-deps = "pnpm install";
      };
    };

    # Configure a web preview for the Next.js application. This allows for
    # a live preview of the web app within the IDE.
    previews = {
      enable = true;
      previews = {
        web = {
          # This command starts the Next.js development server for the 'studio' app.
          # The '-- --port $PORT' part is essential for the preview to work correctly.
          command = ["pnpm", "--filter", "studio", "run", "dev", "--", "--port", "$PORT"];
          manager = "web";
        };
      };
    };
  };
}
