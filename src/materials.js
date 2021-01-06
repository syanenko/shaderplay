import * as THREE from 'three';

import { Camera } from '@mediapipe/camera_utils/camera_utils';
import { Hands  } from '@mediapipe/hands/hands';

// Hands
const handsProc = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
}});
handsProc.onResults(onResults);

// Camera
const videoElement =
  document.getElementsByClassName('input_video')[0];
const camera = new Camera(videoElement, {
    onFrame: async () => {
      await handsProc.send({image: videoElement});
    }
  });
camera.start();

var resolution = new THREE.Vector2(camera.b.width, camera.b.height);
var texture    = new THREE.VideoTexture( videoElement );

const HAND_POINTS = 21;
var fingers = [ new Array(HAND_POINTS), new Array(HAND_POINTS)];
for(let i=0; i<HAND_POINTS; i++)
{
  fingers[0][i] = new THREE.Vector2();
  fingers[1][i] = new THREE.Vector2();
}

var hands = [ new THREE.Vector2(), new THREE.Vector2()];

// Hands results
function onResults(results)
{
  for (let f = 0; f < fingers[0].length; f++)
    fingers[0][f].x = fingers[0][f].y = 
    fingers[1][f].x = fingers[1][f].y = 0;
    
  hands[0].x = hands[0].y = hands[1].x = hands[1].y = 0;
  
  try
  {
    if (results.multiHandLandmarks && results.multiHandedness)
    {
      for (let h = 0; h < results.multiHandLandmarks.length; h++)
      {
          if( !results.multiHandLandmarks[h] )
            continue;
          for (let f = 0; f < results.multiHandLandmarks[h].length; f++)
          {
            if(!results.multiHandLandmarks[h][f])
              continue;
            
            fingers[h][f].x = results.multiHandLandmarks[h][f].x;
            fingers[h][f].y = 1 - results.multiHandLandmarks[h][f].y;

            // TODO: Move toward 0 point
            //hands[h].x += fingers[h][0].x + (fingers[h][0].x - fingers[h][f].x) / 2;
            //hands[h].y += fingers[h][0].y + (fingers[h][0].y + fingers[h][f].y) / 2;

            hands[h].x += fingers[h][f].x;
            hands[h].y += fingers[h][f].y;
          }
      }

      hands[0].x /= HAND_POINTS;
      hands[0].y /= HAND_POINTS;
      hands[1].x /= HAND_POINTS;
      hands[1].y /= HAND_POINTS;
    }
  
  } catch(e)
  {
      console.error(e); 
  }
}

var activeMat = 1, maxMat = 2;

var materials =
[
  // Mat 01
  new THREE.ShaderMaterial(
  {
    uniforms: { u_time:          { value: 1.0 },
                u_texture:       { value: texture    },
                u_resolution:    { value: resolution },
                u_fingers_right: { value: fingers[0] },
                u_fingers_left:  { value: fingers[1] },
                u_hands:         { value: hands      },
                u_size:          { value: 1.7,  control: "SizeSlider"    },
                u_darkness:      { value: 10.0, control: "DarknesSlider" },
                u_debug:         { value: 0,    control: "ToggleMarks"    }
              },

    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader_01' ).textContent
  } ),

  // Mat 02
  new THREE.ShaderMaterial(
  {
    uniforms: { u_time:          { value: 1.0        },
                u_texture:       { value: texture    },
                u_resolution:    { value: resolution },
                u_fingers_right: { value: fingers[0] },
                u_fingers_left:  { value: fingers[1] },
                u_hands:         { value: hands      },
                u_debug:         { value: 0          },
                u_size:          { value: 1.7        },
                u_darkness:      { value: 10.0       }},

    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader_02' ).textContent
  } )
];

export { resolution, materials, fingers };
