```jsonc
{
  "permissions": {
    "defaultMode": "auto", // Auto-approve low-risk calls when no rule matches
    "allow": [
      "Bash(git show:*)", // Commit details
      "Bash(git branch:*)", // List branches (note: git branch -D no longer in deny — falls under this allow)
      "Bash(git remote:*)", // Remote info
      "Bash(git rev-parse:*)", // Resolve refs
      "Bash(git ls-files:*)", // List tracked files
      "Bash(git config --get:*)", // Read config (--unset/--add do not match)
      "Bash(git push:*)", // Plain push auto-approved — force variants moved to ask
      "Bash(git commit:*)", // Commit auto-approved — message mistakes recoverable via amend
      "Bash(which:*)", // Locate executable
      "Bash(whoami)", // Current user
      "Bash(uname:*)", // Kernel/platform info
      "Bash(env)", // Print environment
      "Bash(printenv:*)", // Print specific env var
      "Bash(date)", // Current time
      "Bash(npm ls:*)", // Installed package tree — no install
      "Bash(npm view:*)", // Registry metadata
      "Bash(npm outdated:*)", // Outdated packages list
      "Bash(pip list:*)", // Installed packages — no change
      "Bash(pip show:*)", // Package metadata
      "Bash(ping:*)", // Connectivity check
      "Bash(nslookup:*)", // DNS lookup
      "Bash(dig:*)", // DNS lookup
      "Bash(jq:*)", // JSON parsing
      "Bash(yq:*)", // YAML parsing
      "Bash(gh pr view:*)", // View PR
      "Bash(gh pr create:*)", // PR creation auto-approved — wrong PRs recoverable via close
      "Bash(gh issue view:*)", // View issue
      "Bash(gh repo view:*)", // View repo
    ],
    "ask": [
      "Bash(git push --force:*)", // Rewrites remote history — confirm intent
      "Bash(git push -f:*)", // Same as above (short flag)
      "Bash(git push --force-with-lease:*)", // "Safer" force but still requires confirmation
      "Edit(~/.claude/settings.json)", // Permission policy edit — deny would block future updates
      "Write(~/.claude/settings.json)", // Same as above (Write tool)
      "Edit(~/.claude/hooks/**)", // Hook tampering can intercept all tool calls
    ],
    "deny": [
      "Read(./**/.env)", // Project .env — secret exposure
      "Read(./**/.env.*)", // .env.local, .env.production, etc.
      "Read(~/.ssh/**)", // SSH keys, known_hosts, config
      "Read(~/.aws/**)", // AWS credentials and profile config
      "Read(~/.config/gcloud/**)", // GCP credentials, application_default_credentials.json, access tokens
      "Read(~/.netrc)", // FTP/HTTP credentials
      "Read(**/id_rsa*)", // Private key by name
      "Read(**/*.pem)", // PEM cert/key
      "Read(**/*.key)", // Generic key file
      "Read(**/*service-account*.json)", // GCP service-account key files (common naming)
      "Bash(gh auth token)", // Prints GitHub token in plain text
      "Bash(aws configure:*)", // AWS credential mutation
      "Bash(gcloud auth print-access-token:*)", // Prints GCP user access token
      "Bash(gcloud auth print-identity-token:*)", // Prints GCP identity token
      "Bash(gcloud auth application-default print-access-token:*)", // Prints GCP ADC token
      "Bash(security find-generic-password:*)", // macOS Keychain extraction
      "Bash(security find-internet-password:*)", // macOS Keychain extraction
      "Bash(sudo:*)", // Privilege escalation — system tampering
      "Bash(su:*)", // User switch
      "Bash(rm -rf:*)", // Recursive force delete — single broad block (also catches rm -fr, empty-var pitfalls)
      "Bash(eval:*)", // Arbitrary shell code — bypasses pattern checks
      "Bash(source:*)", // Loads external script — equivalent to eval
    ],
  },
}
```
