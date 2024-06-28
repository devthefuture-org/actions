#!/bin/bash

LOG_NAME="minio"

info() {
    [ -t 1 ] && [ -n "$TERM" ] \
        && echo "$(tput setaf 2)[$LOG_NAME]$(tput sgr0) $*" \
        || echo "[$LOG_NAME] $*"
}

err() {
	[ -t 2 ] && [ -n "$TERM" ] \
		&& echo -e "$(tput setaf 1)[$LOG_NAME]$(tput sgr0) $*" 1>&2 \
		|| echo -e "[$LOG_NAME] $*" 1>&2
}

die() {
	err "$@"
	exit 1
}

ok_or_die() {
	if [ $? -ne 0 ]; then
		die $1
	fi
}

if [[ $# -lt 5 ]] ; then
	die "Usage: $0 url access_key secret_key local_path remote_path"
fi

url=$1
access_key=$2
secret_key=$3
local_path=$4
remote_path=$5

mc alias set s3 $url $access_key $secret_key
ok_or_die "Could not set mc alias"

IFS=' ' read -r -a remote_paths <<< "$remote_path"
for rpath in "${remote_paths[@]}"; do
  info "Will upload $local_path to $rpath"
  mc cp -r $local_path s3/$rpath
	ok_or_die "Could not upload object"
done

if [[ $# -eq 6 ]] ; then
	if [[ $6 -eq 1 ]] ; then
		info "Will make $remote_path public"
		mc anonymous -r set download s3/$remote_path
	else
		info "Will make $remote_path private"
		mc anonymous -r set private s3/$remote_path || true
	fi
fi
