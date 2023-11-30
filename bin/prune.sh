find -- * -name "yarn.lock" -not -path "*node_modules*" -not -path "out*" \
-o -name "package.json" -not -path "*node_modules*" -not -path "out*" | \
xargs -I {} sh -c 'mkdir -p $(dirname out/{}) && cp {} out/{}'