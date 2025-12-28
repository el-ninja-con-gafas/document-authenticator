extract_issue_date() {
  local name="$1"

  local yyyymmdd="${name:3:8}"

  local year="${yyyymmdd:0:4}"
  local month="${yyyymmdd:4:2}"
  local day="${yyyymmdd:6:2}"

  local d_no_leading_zero="${day#0}"
  local suffix="th"
  case "$d_no_leading_zero" in
    1|21|31) suffix="st" ;;
    2|22)    suffix="nd" ;;
    3|23)    suffix="rd" ;;
  esac

  local month_name
  month_name=$(date -d "${year}-${month}-${day}" '+%B')

  echo "${d_no_leading_zero}${suffix} of ${month_name} ${year}"
}