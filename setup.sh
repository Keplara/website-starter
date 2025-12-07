//check that java is available 
// check gradle is availabel
// check docker is available
// check python is available
// if any are missing, print message and exit with error code

// echo "It is recommended to start this project in development"
// make sure you specify an environemnt file for the project
// one will be created for you if it does not exist

#!/usr/bin/env bash

# Ask user for new site name
read -p "Enter the new site name: " input

# Convert to lowercase (for replacing 'mysite')
lowercase=$(echo "$input" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
# Convert to camelCase (for replacing 'MySite')
camel=$(echo "$input" | awk '
{
    # remove spaces
    gsub(/ /, "", $0)
    # lowercase first character
    $0 = tolower(substr($0,1,1)) substr($0,2)
    print
}')

echo "Lowercase name: $lowercase"
echo "CamelCase name: $camel"
echo "Renaming references..."

# Replace inside all files
grep -rl "mysite" . | xargs sed -i "s/mysite/$lowercase/g"
grep -rl "MySite" . | xargs sed -i "s/MySite/$camel/g"

# Rename files and directories containing "mysite"
find . -depth -name "*mysite*" | while read path; do
    newpath=$(echo "$path" | sed "s/mysite/$lowercase/g")
    mv "$path" "$newpath"
done

# Rename files and directories containing "MySite"
find . -depth -name "*MySite*" | while read path; do
    newpath=$(echo "$path" | sed "s/MySite/$camel/g")
    mv "$path" "$newpath"
done

echo "Done!"
