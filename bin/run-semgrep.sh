export SEMGREP_RULES="p/default p/expressjs p/react p/nextjs p/sql-injection p/jwt p/cwe-top-25 p/owasp-top-ten p/r2c-security-audit p/command-injection p/insecure-transport p/secrets p/xss p/gitleaks p/security-code-scan"

while getopts "ad:v" flag
do
   case "${flag}" in
      a) scan_all=true ;; # -a
      d) specified_directory="${OPTARG}" ;; # -d <directory>
   esac
done

runScan () {
  # make some noise
  echo ""
  echo ""
  echo "SEMGREP ANALYSIS FOR: $1"

  semgrep $1 --error
}

# run a scan cases
if [[ ! -z $specified_directory ]]
then
  # specified directory scan
  runScan $specified_directory
elif [[ -z $scan_all ]]
then
  # main repo scan only
  runScan ./
else
  # scan all including submodules
  export cmd="runScan ./"

  # since semgrep does not support running on submodules - https://github.com/returntocorp/semgrep-action/issues/177
  # we have to iterate over all submodules by ourselves
  # and run analysis in a long pipe with && - just to stop scan at the first finding
  for module_path in `git config --file .gitmodules --get-regexp path | awk '{ print $2 }'`; do
    if [ "$module_path" = ".helm" ]; then
      echo "Skipping $module_path"
    else
      cmd="$cmd && runScan $module_path"
    fi
  done

eval "$cmd"
fi