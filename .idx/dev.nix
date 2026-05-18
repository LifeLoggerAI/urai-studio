{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.git
  ];

  # Ultra-minimal Firebase Studio environment.
  # No onCreate install, no extensions, no preview commands during boot.
  # Open the editor first; run install/dev manually from the terminal after it loads.
}
