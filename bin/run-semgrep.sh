export SEMGREP_RULES="p/default p/expressjs p/react p/nextjs p/sql-injection p/jwt p/cwe-top-25 p/owasp-top-ten p/r2c-security-audit p/command-injection p/insecure-transport p/secrets p/xss p/gitleaks p/security-code-scan"

while getopts "sa" flag
do
   case "${flag}" in
      a) scan_all=true ;;
      s) use_sarif=true ;;
   esac
done

runScan () {
  # make some noise
  echo ""
  echo ""
  echo "SEMGREP ANALYSIS FOR: $1"

  # add ext_flags variable in case if use_sarif=true
  if [[ $use_sarif == *true* ]]
  then
    echo "USE SARIF OUTPUT FORMAT"
    export ext_flags="--sarif --output=semgrep_results/${1//\//_}.sarif"
  fi

  semgrep $1 --error $ext_flags
}

# main repo scan command
export cmd="runScan ./"

if [[ $scan_all == *true* ]]
then
  # since semgrep does not support running on submodules - https://github.com/returntocorp/semgrep-action/issues/177
  # we have to iterate over all submodules by ourselves
  # and run analysis in a long pipe with && - just to stop scan at the first finding
  for modulePath in `git config --file .gitmodules --get-regexp path | awk '{ print $2 }'`; do
      cmd="$cmd && runScan $modulePath"
  done
fi

eval "$cmd"