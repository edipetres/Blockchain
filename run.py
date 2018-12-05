import io
import time
import subprocess
import sys

filename = 'test.log'
with io.open(filename, 'wb') as writer, io.open(filename, 'rb', 1) as reader:
    command = 'node src/app.js localhost:5003'
    process = subprocess.Popen(command, stdout=writer)
    while process.poll() is None:
        sys.stdout.write(reader.read())
        time.sleep(0.5)
    # Read the remaining
    sys.stdout.write(reader.read())