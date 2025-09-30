# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.python311Packages.fastapi
    pkgs.python311Packages.uvicorn
    pkgs.python311Packages.sqlalchemy
    pkgs.python311Packages.pydantic
    pkgs.python311Packages.python-multipart
    pkgs.python311Packages.huggingface-hub
    pkgs.python311Packages.transformers
    pkgs.python311Packages.torch
    pkgs.python311Packages.sentencepiece
    pkgs.python311Packages.diffusers
    pkgs.python311Packages.accelerate
    pkgs.python311Packages.passlib
    pkgs.python311Packages.python-jose
    pkgs.python311Packages.cryptography
    pkgs.python311Packages.pillow
    pkgs.python311Packages.requests
    pkgs.nodejs_20
    pkgs.nodePackages.npm
  ];

  # Sets environment variables in the workspace
  env = {
    # For backend
    FRONTEND_URL = "http://localhost:3000";
    SECRET_KEY = "a-very-secret-key"; # Replace with a real secret key
    UNSPLASH_ACCESS_KEY = ""; # Replace with your Unsplash access key if you have one
    # For frontend
    NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000";
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
      "ms-python.python"
    ];

    # Enable previews
    previews = {
      enable = true;
      previews = {
        web = {
          # Example: run "npm run dev" with PORT set to IDX's defined port for previews,
          # and show it in IDX's web preview panel
          command = ["npm" "run" "dev" "--prefix" "frontend"];
          manager = "web";
          env = {
            # Environment variables to set for your server
            PORT = "$PORT";
          };
        };
        backend = {
            command = ["uvicorn" "backend.main:app" "--host" "0.0.0.0" "--port" "8000" "--reload"];
            manager = "process";
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        # Example: install JS dependencies from NPM
        npm-install = "npm install --prefix frontend";
        pip-install = "pip install -r backend/requirements.txt";
      };
      # Runs when the workspace is (re)started
      onStart = {
        # Example: start a background task to watch and re-build backend code
        # watch-backend = "npm run watch-backend";
      };
    };
  };
}
