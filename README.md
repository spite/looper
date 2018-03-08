# looper
Looperepool, a tool to create looperinos

Demo: https://spite.github.io/looper/#4 (Chrome and Safari Tech Preview only)

Steps:

- Point a web server to the root folder of the project, for example in port 8000

- Create a loop script on the loops folder, let's say foo.js. The script is basically an ES6 module that has to export three things:

  - a ```draw``` method, that can take an optional argument timeStart, in case you want to reset the animation when capture starts
  - ```loopDuration```, the duration of the loop in seconds. This will tell the capturer how many frames to get
  - ```canvas```, the HTMLCanvasElement to use for display and capture.

  - 1.js is an example of 2D Canvas
  - 4.js is an example of three.js

- Open localhost:8000#foo
