@echo off

cd /d C:\Users\Alex\MohawkMainlineLive

"C:\Users\Alex\AppData\Local\Programs\Python\Python314\python.exe" backend\update_once.py >> backend\scheduled_update.log 2>&1