# pm2 deploy script
pm2 delete remindbot
NODE_ENV=development pm2 start index.js --watch --name remindbot
