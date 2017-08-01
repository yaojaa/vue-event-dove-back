if [ $# -eq 0 ]
  then
    echo "Migrate /data/eventdove/mysql" 
fi

if [ "$1" == 'load' ]; then
    node --max_old_space_size=9182 process/loader.js
else
    node --max_old_space_size=9182 process/migrator.js $@
fi
        

