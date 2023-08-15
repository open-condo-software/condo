export SEMGREP_RULES="p/default p/expressjs p/react p/nextjs p/sql-injection p/jwt p/cwe-top-25 p/owasp-top-ten p/r2c-security-audit p/command-injection p/insecure-transport p/secrets p/xss p/gitleaks p/security-code-scan"
export SEMGREP_RULES="p/default"
semgrep ci "$@"
