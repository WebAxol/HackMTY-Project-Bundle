import os
import subprocess
import sys

# List of repositories to manage
REPOSITORIES = {
    "client": "https://github.com/Hackihacki-HackMTY/mcp-client.git",
    "server": "https://github.com/Hackihacki-HackMTY/mcp-server.git",
    "web"   : "https://github.com/Hackihacki-HackMTY/website.git"
}

# Base directory where repositories will be stored
BASE_DIR = os.getcwd()

def run_command(command, cwd=None):
    """Run a shell command and print output in real time."""
    process = subprocess.Popen(command, cwd=cwd, shell=True)
    process.communicate()
    if process.returncode != 0:
        raise RuntimeError(f"Error running: {command}")

def ensure_repo(name, url):
    """Clone or update a Git repository."""
    repo_path = os.path.join(BASE_DIR, name)

    if not os.path.exists(BASE_DIR):
        os.makedirs(BASE_DIR)

    if not os.path.exists(repo_path):
        print(f"📥 Cloning {name}...")
        run_command(f"git clone {url} {repo_path}")
    else:
        print(f"🔄 Pulling latest changes for {name}...")
        run_command("git pull origin master", cwd=repo_path)

def run_docker_compose():
    """Run 'docker compose up' in the current directory."""
    print("\n🐳 Migrating to Docker Compose process...\n")
    os.execvp("docker", ["docker", "compose", "up"])
    try:
        run_command("docker compose up")
    except Exception as e:
        print(f"⚠️  Failed to start Docker Compose: {e}")


if __name__ == "__main__":
    for name, url in REPOSITORIES.items():
        try:
            ensure_repo(name, url)
        except Exception as e:
            print(f"⚠️  Error with {name}: {e}")


run_docker_compose()