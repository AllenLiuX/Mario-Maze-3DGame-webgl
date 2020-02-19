window.Shape_From_File = window.classes.Shape_From_File =
class Shape_From_File extends Shape          // A versatile standalone Shape that imports all its arrays' data from an .obj 3D model file.
{ constructor( filename )
    { super( "positions", "normals", "texture_coords" );
      this.load_file( filename );      // Begin downloading the mesh. Once that completes, return control to our parse_into_mesh function.
    }
  load_file( filename )
      { return fetch( filename )       // Request the external file and wait for it to load.
          .then( response =>
            { if ( response.ok )  return Promise.resolve( response.text() )
              else                return Promise.reject ( response.status )
            })
          .then( obj_file_contents => this.parse_into_mesh( obj_file_contents ) )
          .catch( error => { this.copy_onto_graphics_card( this.gl ); } )                     // Failure mode:  Loads an empty shape.
      }
  parse_into_mesh( data )                                           // Adapted from the "webgl-obj-loader.js" library found online:
    { var verts = [], vertNormals = [], textures = [], unpacked = {};

      unpacked.verts = [];        unpacked.norms = [];    unpacked.textures = [];
      unpacked.hashindices = {};  unpacked.indices = [];  unpacked.index = 0;

      var lines = data.split('\n');

      var VERTEX_RE = /^v\s/;    var NORMAL_RE = /^vn\s/;    var TEXTURE_RE = /^vt\s/;
      var FACE_RE = /^f\s/;      var WHITESPACE_RE = /\s+/;

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        var elements = line.split(WHITESPACE_RE);
        elements.shift();

        if      (VERTEX_RE.test(line))   verts.push.apply(verts, elements);
        else if (NORMAL_RE.test(line))   vertNormals.push.apply(vertNormals, elements);
        else if (TEXTURE_RE.test(line))  textures.push.apply(textures, elements);
        else if (FACE_RE.test(line)) {
          var quad = false;
          for (var j = 0, eleLen = elements.length; j < eleLen; j++)
          {
              if(j === 3 && !quad) {  j = 2;  quad = true;  }
              if(elements[j] in unpacked.hashindices)
                  unpacked.indices.push(unpacked.hashindices[elements[j]]);
              else
              {
                  var vertex = elements[ j ].split( '/' );

                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);   unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);

                  if (textures.length)
                    {   unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 0]);
                        unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 1]);  }

                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 0]);
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 1]);
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 2]);

                  unpacked.hashindices[elements[j]] = unpacked.index;
                  unpacked.indices.push(unpacked.index);
                  unpacked.index += 1;
              }
              if(j === 3 && quad)   unpacked.indices.push( unpacked.hashindices[elements[0]]);
          }
        }
      }
      for( var j = 0; j < unpacked.verts.length/3; j++ )
      {
        this.positions     .push( Vec.of( unpacked.verts[ 3*j ], unpacked.verts[ 3*j + 1 ], unpacked.verts[ 3*j + 2 ] ) );
        this.normals       .push( Vec.of( unpacked.norms[ 3*j ], unpacked.norms[ 3*j + 1 ], unpacked.norms[ 3*j + 2 ] ) );
        this.texture_coords.push( Vec.of( unpacked.textures[ 2*j ], unpacked.textures[ 2*j + 1 ]  ));
      }
      this.indices = unpacked.indices;

      this.normalize_positions( false );
      this.copy_onto_graphics_card( this.gl );
      this.ready = true;
    }
  draw( graphics_state, model_transform, material )       // Cancel all attempts to draw the shape before it loads.
    { if( this.ready ) super.draw( graphics_state, model_transform, material );   }
}


window.Cube = window.classes.Cube =
class Cube extends Shape                 // Here's a complete, working example of a Shape subclass.  It is a blueprint for a cube.
  { constructor( zoom = 2 )
      { super( "positions", "normals", "texture_coords" ); // Name the values we'll define per each vertex.  They'll have positions and normals.

        // First, specify the vertex positions -- just a bunch of points that exist at the corners of an imaginary cube.
        this.positions.push( ...Vec.cast( [-0.5,-0.5,-0.5], [0.5,-0.5,-0.5], [-0.5,-0.5,0.5], [0.5,-0.5,0.5], [0.5,0.5,-0.5],  [-0.5,0.5,-0.5],
                                          [0.5,0.5,0.5],  [-0.5,0.5,0.5], [-0.5,-0.5,-0.5], [-0.5,-0.5,0.5], [-0.5,0.5,-0.5], [-0.5,0.5,0.5], 
                                          [0.5,-0.5,0.5],  [0.5,-0.5,-0.5],  [0.5,0.5,0.5],  [0.5,0.5,-0.5], [-0.5,-0.5,0.5],  [0.5,-0.5,0.5],
                                          [-0.5,0.5,0.5],  [0.5,0.5,0.5], [0.5,-0.5,-0.5], [-0.5,-0.5,-0.5], [0.5,0.5,-0.5], [-0.5,0.5,-0.5] ) );
        // Supply vectors that point away from eace face of the cube.  They should match up with the points in the above list
        // Normal vectors are needed so the graphics engine can know if the shape is pointed at light or not, and color it accordingly.
        this.normals.push(   ...Vec.cast( [0,-1,0], [0,-1,0], [0,-1,0], [0,-1,0], [0,1,0], [0,1,0], [0,1,0], [0,1,0], [-1,0,0], [-1,0,0],
                                          [-1,0,0], [-1,0,0], [1,0,0],  [1,0,0],  [1,0,0], [1,0,0], [0,0,1], [0,0,1], [0,0,1],   [0,0,1],
                                          [0,0,-1], [0,0,-1], [0,0,-1], [0,0,-1] ) );

                 // Those two lists, positions and normals, fully describe the "vertices".  What's the "i"th vertex?  Simply the combined
                 // data you get if you look up index "i" of both lists above -- a position and a normal vector, together.  Now let's
                 // tell it how to connect vertex entries into triangles.  Every three indices in this list makes one triangle:
        this.indices.push( 0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
                          14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22 );
        // It stinks to manage arrays this big.  Later we'll show code that generates these same cube vertices more automatically.
        let k = 1/zoom;
        this.texture_coords=  [ [0,0], [k,0], [0,k], [k,k],
                                [0,0], [k,0], [0,k], [k,k],
                                [0,0], [k,0], [0,k], [k,k],
                                [0,0], [k,0], [0,k], [k,k],
                                [0,0], [k,0], [0,k], [k,k],
                                [0,0], [k,0], [0,k], [k,k]  ];      
      }
  }

window.Maze_Scene = window.classes.Maze_Scene =
class Maze_Scene extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   )
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );

        const r = context.width/context.height;

        this.camera_angle = 0;
        this.old_camera_angle = 0;
        this.speed = 1; //speed of human
        this.camera_pos = Vec.of(25,0,0); //initial camera position
        this.jump_init_velocity = 8;
        this.jump_time = 0;
        this.gravity = 10;

        this.old_camera_pos = Vec.of(25,0,0);
        context.globals.graphics_state.camera_transform = Mat4.identity(); //unused
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

        const shapes = { 'box': new Cube(),               // At the beginning of our program, load one of each of these shape
                         'ball': new Subdivision_Sphere(4),
//                          'door': new Shape_From_File( "assets/door2.obj" ),
//                          'monster': new Shape_From_File( "assets/monster1.OBJ"),
                         'key': new Shape_From_File( "assets/key1.obj"),
                         'mario': new Shape_From_File( "assets/mario2.obj"),
                         'fence': new Shape_From_File("assets/fence1.obj"),
                         'flag': new Shape_From_File("assets/flag.obj"),

                                                      // definitions onto the GPU.  NOTE:  Only do this ONCE per shape
                      }                                   // design.  Once you've told the GPU what the design of a cube is,
        this.submit_shapes( context, shapes );            // it would be redundant to tell it again.  You should just re-use
                                                          // the one called "box" more than once in display() to draw
                                                          // multiple cubes.  Don't define more than one blueprint for the
                                                          // same thing here.

        this.clay   = context.get_instance( Phong_Shader ).material( Color.of( .9,.5,.9, 1 ), { ambient: .4, diffusivity: .4 } ); // Make some Material objects available to you:
        this.plastic  = this.clay.override({specularity: .6});      

        this.materials = {
                wall: context.get_instance( Phong_Shader ).material( Color.of(0,0,0,1), {ambient: 1, 
                        texture: context.get_instance( "assets/G.jpg", true), diffusivity: 0, specularity:0} ),
//                 door: context.get_instance( Phong_Shader ).material( Color.of(0,0,0,1), {ambient: 1, 
//                         texture: context.get_instance( "assets/door1.jpg", true)} ),
                key: context.get_instance( Phong_Shader ).material( Color.of(0,1,1,1), {ambient: 1, 
                        texture: context.get_instance( "assets/key1.bmp", true)} ),
                mario: context.get_instance( Phong_Shader ).material( Color.of(0,0,0,1), {ambient: 1, 
                        texture: context.get_instance( "assets/mario2.bmp", true)} )
        }                       
        
        this.maze_scale=10;
        this.lights = [ new Light( Vec.of( 0,5,5,1 ), Color.of( 1, .4, 1, 1 ), 100000 ) ];

        this.camera_perspective="first_person";

        //store the coordinate of edges
        this.horizontal_edges=[
             //horizontal edges
             [0,0,2,0],
             [0,6,5,6],
             [0,11,6,11],
             [1,2,2,2],
             [1,5,6,5],
             [1,9,3,9],
             [1,10,4,10],
             [2,1,3,1],
             [2,3,4,3],
             [2,4,7,4],
             [3,0,7,0],
             [3,2,5,2],
             [3,8,6,8],
             [4,7,6,7],
             [5,3,6,3],
             [5,9,7,9],
             [6,2,7,2],
        ];

        this.vertical_edges=[
             [0,0,0,11],
             [1,1,1,2],
             [1,3,1,5],
             [1,7,1,9],
             [2,0,2,1],
             [2,2,2,4],
             [2,6,2,8],
             [3,1,3,2],
             [3,7,3,9],
             [4,0,4,1],
             [4,6,4,7],
             [4,9,4,11],
             [5,1,5,3],
             [5,8,5,10],
             [6,1,6,2],
             [6,5,6,7],
             [6,10,6,11],
             [7,0,7,11]
        ];

        this.maze_scale = 10;
        this.monster_mat_1 = Mat4.identity().times(Mat4.translation([5,0,55]));
        this.monster_mat_2 = Mat4.identity().times(Mat4.translation([35,0,105]));
        this.monster_1_pos = [5, 0, 55];
        this.monster_2_pos = [35, 0, 105];
        this.monster_1_angle = 0;
        this.monster_2_angle = 0;

        this.obstacles = [
             Vec.of(55,0,15),
             Vec.of(50,0,45),
             Vec.of(20,0,95),
             Vec.of(40,0,55)
        ];
        this.door_location = [
                Mat4.identity().times(Mat4.translation([10, 0, 55])),
                Mat4.identity().times(Mat4.translation([35, 0, 70]))
        ]
        this.key_location = [
                Mat4.identity().times(Mat4.translation([25, -1, 45])).times(Mat4.rotation(0.5 * Math.PI, Vec.of(0,1,0)))
                               .times(Mat4.rotation(0.25 * Math.PI, Vec.of(0,0,1))).times(Mat4.scale([0.6,0.6,0.6])),
                Mat4.identity().times(Mat4.translation([55, -1 ,65]))
                .times(Mat4.rotation(0.25 * Math.PI, Vec.of(0,0,1))).times(Mat4.scale([0.6,0.6,0.6]))
        ]
        this.win_location = Vec.of(65,0,110);

        this.key_1 = false;
        this.key_2 = false;
        this.door_1 = false;
        this.door_2 = false;
        this.door_1_cycle = 3.5;
        this.door_2_cycle = 3.5;
        this.door_1_time = this.door_1_cycle;
        this.door_2_time = this.door_2_cycle;
        this.test = false;
        this.health = 3;
        this.invincible_time = 0;

        this.game_status = false;
        this.begin_time = 0;
        this.record_begin = false;
        this.invincile = false;
        this.win_game = false;

      }

    make_control_panel()             // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      {  
         // Add a button for controlling the scene.
        this.key_triggered_button( "turn right",     [ "k" ], () => this.camera_angle -= Math.PI/10,
            undefined, () => 0 );
        this.key_triggered_button( "turn left",     [ "j" ], () => this.camera_angle += Math.PI/10,
            undefined, () => 0 );
        this.new_line();
        this.key_triggered_button( "Forward",[ "w" ], () =>
         {
           this.game_status = true;
           document.getElementById("walk_sound").play();
           this.camera_pos[2] +=  this.speed* Math.cos(this.camera_angle);
           this.camera_pos[0] +=  this.speed* -Math.sin(this.camera_angle);
           if(this.collision_detection(this.camera_pos,1.5)){
                 this.camera_pos[2] -=  this.speed* Math.cos(this.camera_angle);
                 this.camera_pos[0] -=  this.speed* -Math.sin(this.camera_angle);
           }
         }, undefined, () => 0 );

        
        this.key_triggered_button( "Back",   [ "s" ], () => 
        {
           this.game_status = true;
           document.getElementById("walk_sound").play();
           this.camera_pos[2] -=  this.speed* Math.cos(this.camera_angle);
           this.camera_pos[0] -=  this.speed* -Math.sin(this.camera_angle);

           if(this.collision_detection(this.camera_pos,1.5)){
                 this.camera_pos[2] +=  this.speed* Math.cos(this.camera_angle);
                 this.camera_pos[0] +=  this.speed* -Math.sin(this.camera_angle);
           }
         }, undefined, () => 0 );  

        this.key_triggered_button( "Left",   [ "a" ], () => 
        {
          this.game_status = true;
          document.getElementById("walk_sound").play();
          this.camera_pos[2] -=  Math.sin(this.camera_angle);
          this.camera_pos[0] -=  Math.cos(this.camera_angle);

          if(this.collision_detection(this.camera_pos,1.5)){
                this.camera_pos[2] +=  Math.sin(this.camera_angle);
                this.camera_pos[0] +=  Math.cos(this.camera_angle);
          }
        }, undefined, () => 0 ); 

        this.key_triggered_button( "Right",  [ "d" ], () => 
        {
          this.game_status = true;
          document.getElementById("walk_sound").play();
          this.camera_pos[2] +=  Math.sin(this.camera_angle);
          this.camera_pos[0] +=  Math.cos(this.camera_angle);

          if(this.collision_detection(this.camera_pos,1.5)){
             this.camera_pos[2] -=  Math.sin(this.camera_angle);
             this.camera_pos[0] -=  Math.cos(this.camera_angle);   
          }
        }, undefined, () => 0 ); 

        this.new_line();

        this.key_triggered_button("squat", ["x"], () => {
                this.camera_pos[1] = -3;
                this.speed = 0.25;
        },
        undefined,() =>{
                this.camera_pos[1] = 0;
                this.speed = 1;
        });

        this.key_triggered_button("jump", [" "], () => {
              if(this.jump_time == 0){
                this.jump_time = this.jump_init_velocity/this.gravity * 2;
                this.speed = 1;
              }
        });

        this.key_triggered_button("open door", ["o"], () => {
               let l = 7.5;
               let door_location = this.door_location;
               let door_1_vec = Vec.of(door_location[0][0][3], door_location[0][1][3], door_location[0][2][3]);
               let door_2_vec = Vec.of(door_location[1][0][3], door_location[1][1][3], door_location[1][2][3]);  
               if(this.key_1 && Math.abs(door_1_vec[0] - this.camera_pos[0]) <= l &&
                        Math.abs(door_1_vec[2] - 55) <= 5){
                        this.door_1 = true;
                        document.getElementById("door_sound").play();

               }
               if(this.key_2 && Math.abs(door_2_vec[2] - this.camera_pos[2]) <= l && 
                        Math.abs(door_2_vec[0] - 35) <= 5){
                        this.door_2 = true;
                        document.getElementById("door_sound").play();
               }
        }); this.new_line();

        this.key_triggered_button("global perspective", ["g"], () => {
           if(this.camera_perspective != "global"){
//               this.old_camera_angle = this.camera_angle;
              this.camera_perspective = "global";
           }
        }); this.new_line();

        this.key_triggered_button("first person perspective", ["f"], () => {
           if(this.camera_perspective != "first_person"){
//               this.camera_angle = this.old_camera_angle;
              this.camera_perspective = "first_person";
           }
        }); this.new_line();
        
        this.key_triggered_button("third person perspective", ["t"], () => {
           if(this.camera_perspective != "third_person"){
//               this.camera_angle = this.old_camera_angle;
              this.camera_perspective = "third_person";
           }
        }); this.new_line();

        this.key_triggered_button("Start", ["Enter"], () => {
           this.game_status = true;

        }); 

        this.key_triggered_button("test_wall", ["1"], () => {
               this.test = !this.test;
        });

        this.key_triggered_button("test_invincible", ["2"], () => {
            this.invincile = !this.invincile;
        });

      }
    draw_maze( graphics_state, model_transform, thickness, height, material)
      {
         let x_scale = Mat4.scale([thickness,height,1]);
         let z_scale = Mat4.scale([1,height,thickness]);
  
         let i;
         let to_translate, to_scale, transformation;
         for(i = 0; i < this.horizontal_edges.length; i++){
             to_translate = Mat4.translation([(this.horizontal_edges[i][2] + this.horizontal_edges[i][0])/2,0,this.horizontal_edges[i][1]]);
             to_scale = Mat4.scale([this.horizontal_edges[i][2] - this.horizontal_edges[i][0],1,1]);
             transformation = model_transform.times(to_translate).times(to_scale).times(z_scale);
             this.shapes.box.draw(graphics_state,transformation,material);
         };


         for(i = 0; i < this.vertical_edges.length; i++){
             to_translate = Mat4.translation([this.vertical_edges[i][0],0,(this.vertical_edges[i][3] + this.vertical_edges[i][1])/2]);
             to_scale = Mat4.scale([1,1,this.vertical_edges[i][3] - this.vertical_edges[i][1]]);
             transformation = model_transform.times(to_translate).times(to_scale).times(x_scale);
             this.shapes.box.draw(graphics_state,transformation,material);
         };
          

      }
    collision_detection(pos, detection_boundary){
        if(this.test){
                return false;
        }
        for(let i = 0; i < this.horizontal_edges.length; i++){
            if(pos[0] >= this.horizontal_edges[i][0] * this.maze_scale - detection_boundary 
            && pos[0] <= this.horizontal_edges[i][2] * this.maze_scale + detection_boundary){
                  if(pos[2] >= this.horizontal_edges[i][1]*this.maze_scale - detection_boundary 
                  && pos[2] <= this.horizontal_edges[i][3]*this.maze_scale + detection_boundary){
                        return true;
                  }
            }
        }

        for(let i = 0; i < this.vertical_edges.length; i++){
            if(pos[2] >= this.vertical_edges[i][1] * this.maze_scale -detection_boundary 
            && pos[2] <= this.vertical_edges[i][3] * this.maze_scale + detection_boundary){
                  if(pos[0] >= this.vertical_edges[i][0]*this.maze_scale - detection_boundary 
                  && pos[0] <= this.vertical_edges[i][0]*this.maze_scale + detection_boundary){
                        return true;
                  }
            }
        }
        //door 1
        if(pos[2] <= this.door_location[0][2][3] + 5 + detection_boundary 
            && pos[2] >= this.door_location[0][2][3] - 5 - detection_boundary){
                  if(pos[0] >= this.door_location[0][0][3] - detection_boundary 
                  && pos[0] <= this.door_location[0][0][3] + detection_boundary){
                        return true;
                  }
        }

        //door_2
        if(pos[2] <= this.door_location[1][2][3] + detection_boundary 
            && pos[2] >= this.door_location[1][2][3] - detection_boundary){
                  if(pos[0] >= this.door_location[1][0][3] - 5 - detection_boundary 
                  && pos[0] <= this.door_location[1][0][3] + 5 + detection_boundary){
                        return true;
                  }
        }
        return false;
    }
    death_detection(graphics_state){
        let detection_boundary = 5;
        //monster_1
        let monster1= Vec.of(this.monster_1_pos[0], this.monster_1_pos[1], this.monster_1_pos[2]);
        let distance_1 = this.camera_pos.minus(monster1);
        if(distance_1.norm() <= detection_boundary){
            return true;
        } 

        //monster_2
        let monster2= Vec.of(this.monster_2_pos[0], this.monster_2_pos[1], this.monster_2_pos[2]);
        let distance_2 = this.camera_pos.minus(monster2);
        if(distance_2.norm() <= detection_boundary){
            return true;
        } 
        //obstacles
        for(let i = 0; i < this.obstacles.length; i++){
            {
               if(this.camera_pos[0] <= this.obstacles[i][0] + 3 && this.camera_pos[0] >= this.obstacles[i][0] - 3){
                  if(this.camera_pos[2] <= this.obstacles[i][2] + 3 && this.camera_pos[2] >= this.obstacles[i][2] - 3){
                        if(this.camera_pos[1] <= Math.sin(graphics_state.animation_time*3/1000)){
                            return true;
                        }
                  } 
               }
            }
        }
        return false;
    }
    update_health(graphics_state){
        if(this.invincible_time > 0 || this.invincile){
            this.invincible_time -= graphics_state.animation_delta_time/1000;
        }
        else{
            if(this.death_detection(graphics_state)){
                if(this.health > 1){
                    document.getElementById("blood_sound").play();
                    this.health -= 1;
                }
                else if(this.health==1){
                    document.getElementById("die_sound").play();
                    this.health -= 1;
                }
                this.invincible_time = 2;
            }
        }
    }
    update_monster(graphics_state){
        //monster_movement
        const t = graphics_state.animation_time/1000;
        let cycle_1 = 20;
        let time_in_cycle_1 = t  % cycle_1;
        if( time_in_cycle_1 < 0.5 * cycle_1){
                this.monster_1_pos = [5,0, time_in_cycle_1 / cycle_1* 5 * this.maze_scale * 2 + 5];
                this.monster_1_angle = 0;
        }
        else{
                this.monster_1_pos = [5,0, -time_in_cycle_1 / cycle_1 * this.maze_scale * 5 * 2 + 5 + 10 * this.maze_scale];
                this.monster_2_angle = Math.PI;
        }


        let cycle_2 = 28;
        let time_in_cycle_2 = t  % cycle_2;
        if( time_in_cycle_2 < 6/28 * cycle_2){
                this.monster_2_pos = [(-time_in_cycle_2/(cycle_2 / 28 * 6) * 3 + 3.5) * this.maze_scale, 0, 105];
                this.monster_2_angle = Math.PI/2;
        }
        else if(time_in_cycle_2 >= 6/28 * cycle_2 && time_in_cycle_2 < 14/28 * cycle_2){
                this.monster_2_pos = [5, 0, -4 * (time_in_cycle_2 - 6)/(cycle_2/28 *8) * this.maze_scale + 105 ];
                this.monster_2_angle = 0;
        }
        else if(time_in_cycle_2 >= 14/28 * cycle_2 && time_in_cycle_2 < 22/28 * cycle_2){
                this.monster_2_pos = [5, 0, 4 * (time_in_cycle_2 - 14)/(cycle_2/28 *8) * this.maze_scale + 65 ];
                this.monster_2_angle = Math.PI;
        }
        else{
                this.monster_2_pos = [(time_in_cycle_2 - 22)/(cycle_2/28 * 6) * 3 * this.maze_scale + 5, 0, 105];
                this.monster_2_angle = Math.PI*3/2;
        }

        this.monster_mat_1 = Mat4.translation(this.monster_1_pos).times(Mat4.rotation(this.monster_1_angle, Vec.of(0,1,0)));
        this.monster_mat_2 = Mat4.translation(this.monster_2_pos).times(Mat4.rotation(this.monster_2_angle, Vec.of(0,1,0)));    
    }
    draw_monster( graphics_state, height, monster_location ){
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
        height = height * this.maze_scale;
        let character_size = 0.9;
        let character_transform = Mat4.translation([0, (character_size - 1 ) * height * 0.13 ,0])
                                  .times(Mat4.scale([character_size, character_size, character_size]));
        let head_transform = monster_location.times(Mat4.translation([0, height * 0.205 * character_size, 0]))
                                             .times(Mat4.scale([2,2,2])).times(character_transform);
        this.shapes.box.draw(graphics_state, head_transform, this.plastic.override({color: Color.of(1,0,0,1)}));
        let body_transform = monster_location.times(Mat4.translation([0,-1 * height * 0.04 * character_size, 0]))
                                             .times(Mat4.scale([2,3,1])).times(character_transform);
        this.shapes.box.draw(graphics_state, body_transform, this.plastic.override({color: Color.of(1,0,0,1)}))     
        let leg_1_transfrom = monster_location.times(Mat4.rotation(-0.35 * Math.cos(3 * t), Vec.of(1,0,0)))
                                              .times(Mat4.translation([height * 0.05 * character_size, -1 * height * 0.35 * character_size, 0]))
                                              .times(Mat4.scale([0.9,3,1])).times(character_transform);
        let leg_2_transfrom = monster_location.times(Mat4.rotation(0.35 * Math.cos(3 * t), Vec.of(1,0,0)))
                                              .times(Mat4.translation([-1 * height * 0.05 * character_size, -1 * height * 0.35 * character_size, 0]))
                                              .times(Mat4.scale([0.9,3,1])).times(character_transform);
        this.shapes.box.draw(graphics_state, leg_1_transfrom, this.plastic.override({color: Color.of(1,0,0,1)}));
        this.shapes.box.draw(graphics_state, leg_2_transfrom, this.plastic.override({color: Color.of(1,0,0,1)}));
        let arm_1_transfrom = monster_location.times(Mat4.translation([0,height * 0.1 * character_size,0]))
                                              .times(Mat4.rotation(0.35 * Math.cos(3 * t), Vec.of(1,0,0)))
                                              .times(Mat4.translation([0,-height * 0.1 * character_size,0]))
                                              .times(Mat4.translation([height * 0.145 * character_size, -1 * height * 0.05 * character_size, 0]))
                                              .times(Mat4.scale([0.75,3,1])).times(character_transform);
        let arm_2_transfrom = monster_location.times(Mat4.translation([0,height * 0.1 * character_size,0]))
                                              .times(Mat4.rotation(-0.35 * Math.cos(3 * t), Vec.of(1,0,0)))
                                              .times(Mat4.translation([0,-height * 0.1 * character_size,0]))
                                              .times(Mat4.translation([-1 * height * 0.145 * character_size, -1 * height * 0.05 * character_size, 0]))
                                              .times(Mat4.scale([0.75,3,1])).times(character_transform);
        this.shapes.box.draw(graphics_state, arm_1_transfrom, this.plastic.override({color: Color.of(0.74,0.45,0.29,1)}));
        this.shapes.box.draw(graphics_state, arm_2_transfrom, this.plastic.override({color: Color.of(0.74,0.45,0.29,1)}));
    }

    draw_obstacle( graphics_state, model_transform, obstacle_location, material ){
        let k = 1.8;
        let obstacles = [
            obstacle_location.plus(Vec.of(0,0,0)), obstacle_location.plus(Vec.of(0,0,k)), 
            obstacle_location.plus(Vec.of(0,0,-k)), obstacle_location.plus(Vec.of(k,0,0)), 
            obstacle_location.plus(Vec.of(k,0,k)), obstacle_location.plus(Vec.of(k,0,-k)),
            obstacle_location.plus(Vec.of(-k,0,0)), obstacle_location.plus(Vec.of(-k,0,k)), 
            obstacle_location.plus(Vec.of(-k,0,-k))
        ]
        for(let i = 0; i < 9; i++){
          obstacle_location = obstacles[i];
          const t = graphics_state.animation_time*3/1000;
          let transformation = model_transform.times(Mat4.translation([ obstacle_location[0], -5.5, obstacle_location[2] ])).times(Mat4.scale([1,0.35,1]));
          transformation = transformation.times(Mat4.scale([1,Math.sin(t),1]));
          this.shapes.box.draw(graphics_state, transformation, material );
          this.shapes.box.draw(graphics_state, model_transform.times(Mat4.translation([ obstacle_location[0], -5.5, obstacle_location[2] ])), material );
          for(let i=0; i<10; i++){
              transformation = transformation.times(Mat4.translation([0,1,0])).times(Mat4.scale([0.9-i/20,0.9-i/20,0.9-i/20]));
              this.shapes.box.draw(graphics_state,transformation, material );
          }                
        }
    }
    update_door(graphics_state){
        
        if(!this.door_1){
            this.door_location[0] = Mat4.translation([10,0,55]);
        }
        else{
            this.door_location[0] = Mat4.translation([10,0, this.door_1_time/this.door_1_cycle * 10 + 45]);
            if(this.door_1_time > 0){
                this.door_1_time -= graphics_state.animation_delta_time/1000;
            }    
        }

        if(!this.door_2){
            this.door_location[1] = Mat4.translation([35,0,70]);    
        }
        else{
            this.door_location[1] = Mat4.translation([-this.door_2_time/this.door_2_cycle * 10 + 45, 0, 70]);
            if(this.door_2_time > 0){
                this.door_2_time -= graphics_state.animation_delta_time/1000;   
            }   
        }    
    }
    draw_door_key(graphics_state, model_transform, door_location, key_location){
         const t = graphics_state.animation_time / 1000;
         let k = 1.5; // pick up range
         let key_1_vec = Vec.of(key_location[0][0][3], key_location[0][1][3], key_location[0][2][3]);
         let key_2_vec = Vec.of(key_location[1][0][3], key_location[1][1][3], key_location[1][2][3]);
         let door_1_vec = Vec.of(door_location[1][0][3], door_location[1][1][3], door_location[1][2][3]);
         let door_2_vec = Vec.of(door_location[1][0][3], door_location[1][1][3], door_location[1][2][3]);

         if(Math.abs(key_1_vec[0] - this.camera_pos[0]) <= k && Math.abs(key_1_vec[2] - this.camera_pos[2]) <= k){
             this.key_1 = true;
         }
         if(Math.abs(key_2_vec[0] - this.camera_pos[0]) <= k && Math.abs(key_2_vec[2] - this.camera_pos[2]) <= k){
             this.key_2 = true;
         }
         if(!this.key_1){
             this.shapes.key.draw(graphics_state, key_location[0], this.materials.key );
         }

         if(!this.key_2){
             this.shapes.key.draw(graphics_state, key_location[1], this.materials.key  );
         }

//          let door_location_1 = door_location[0].times(Mat4.scale([0.8,1,10]));
//          let door_location_2 = door_location[1].times(Mat4.scale([10,1,0.8]));
         let door_location_1 = door_location[0].times(Mat4.rotation(1/2*Math.PI,Vec.of(0,1,0))).times(Mat4.scale([2.2,3,3])).times(Mat4.translation([0,-0.33,0]));
         let door_location_2 = door_location[1].times(Mat4.scale([2.2,3,3])).times(Mat4.translation([0,-0.33,0]));

         this.shapes.fence.draw(graphics_state, door_location_1, this.plastic.override({color: Color.of(0,0,0,1)}));             
         this.shapes.fence.draw(graphics_state, door_location_2, this.plastic.override({color: Color.of(0,0,0,1)}));             
    }

    detect_win(graphics_state, win_location){
        let k = 1.5; 
        if(Math.abs(win_location[0] - this.camera_pos[0]) <= k && Math.abs(win_location[2] - this.camera_pos[2]) <= k){
             if(!this.win_game)
                document.getElementById("win_sound").play();
             this.win_game = true;
             this.game_status = false;
             document.getElementById("win").style.display="inline";
             return true;
         }
         return false;
    }

    display( graphics_state )
      { graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        const t = graphics_state.animation_time / 1000;
        //timer
        if(this.game_status){
                if(!this.record_begin){
                        this.record_begin=true;
                        this.begin_time = t;
                }
                this.get_keynum();
                this.get_info(t-this.begin_time);    
        }
        

        //thickness of the wall
        let thickness = 0.1; 
        let height = 1;

        let mirror_x = Mat.of([-1,0,0,0],
                              [0,1,0,0],
                              [0,0,1,0],
                              [0,0,0,1]);
        
        let player_transform;
                        
        if(this.jump_time > 0){
            this.jump_time -= graphics_state.animation_delta_time/1000;
            this.camera_pos[1] = this.jump_init_velocity*this.jump_time - this.gravity/2* (this.jump_time**2);
        }
        if(this.jump_time < 0){
            this.jump_time = 0;
            this.camera_pos[1] = 0;
        }

        let sphere_color = Color.of(1,0,0,1);  //color of player 
        if(this.invincible_time > 0){ //if in invincible time, color of player alternate between red and pink
             if(t % 0.1 < 0.05){
                  sphere_color = Color.of(1,0,0,1);
             }
             else{
                  sphere_color = Color.of(1, 0.412, 0.706,1);
             }
        }
        if(this.camera_perspective == "first_person"){
            graphics_state.camera_transform = 
             mirror_x.times(Mat4.look_at(this.camera_pos,
                  Vec.of(-Math.sin(this.camera_angle),-0.1,Math.cos(this.camera_angle)).plus(this.camera_pos)
                  ,Vec.of(0,1,0)));
        } 
        else if(this.camera_perspective == "global"){
            
//             this.camera_angle = 0;     
            graphics_state.camera_transform = 
                  mirror_x.times(Mat4.look_at(Vec.of(35,150,55),Vec.of(35,0,55),Vec.of(0,0,1)));   
            
            let player_transform = Mat4.translation(this.camera_pos).times(Mat4.scale([2,2,2]));
//             this.shapes.ball.draw(graphics_state, player_transform, this.plastic.override({color: sphere_color}));
            player_transform = player_transform.times(Mat4.rotation(-this.camera_angle,Vec.of(0,1,0)));
            this.shapes.mario.draw(graphics_state, player_transform, this.materials.mario);
        }
        else{ //third_person perspective
               
            graphics_state.camera_transform = 
                  mirror_x.times(Mat4.look_at(Vec.of(-8*Math.sin(-this.camera_angle),8,-8*Math.cos(-this.camera_angle)).plus(this.camera_pos),
                  this.camera_pos,Vec.of(0,1,0)));   
            
            let player_transform = Mat4.translation(this.camera_pos).times(Mat4.scale([2,2,2])).times(Mat4.rotation(-this.camera_angle,Vec.of(0,1,0)));
//             this.shapes.ball.draw(graphics_state, player_transform, this.plastic.override({color: sphere_color}));
            this.shapes.mario.draw(graphics_state, player_transform, this.materials.mario);
        }
        let model_transform = Mat4.scale([this.maze_scale,this.maze_scale,this.maze_scale]);



        //draw the first block
        this.draw_maze(graphics_state, model_transform, thickness, height, this.materials.wall);

        let floor = model_transform.times(Mat4.translation([3.5,-0.5,5.5])).times(Mat4.scale([7,0.05,11]));
//         this.shapes.box.draw(graphics_state,floor, this.plastic.override({color: Color.of(0.741,0.739,0.420,1)}));
        this.shapes.box.draw(graphics_state,floor, this.plastic.override({color: Color.of(0.2,0.2,0.2,1)}));
        
        //update and draw the monster
        this.update_monster(graphics_state);
        this.draw_monster( graphics_state, height, this.monster_mat_1);
        this.draw_monster( graphics_state, height, this.monster_mat_2);
        

        //draw the obstacles
        for(let i = 0; i < 4; i++){
            let obstacle_location = this.obstacles[i];
            this.draw_obstacle(graphics_state, Mat4.identity(), obstacle_location, this.plastic.override({color: Color.of(0.4,0.4,0.4,1)}) );
        }
        
        this.update_door(graphics_state);
        //draw the key and door_location
        this.draw_door_key( graphics_state, model_transform, this.door_location, this.key_location);
      
        let flag_transform=Mat4.identity().times(Mat4.translation([ 65, -2, 108 ])).times(Mat4.scale([2,2,2]));
        this.shapes.flag.draw(graphics_state, flag_transform, this.plastic.override({color: Color.of(1,0,0,1)}) );
//         this.shapes.mario.draw(graphics_state, door_transform.times(Mat4.translation([0,0,2])), this.materials.mario);
        this.update_health(graphics_state);
        this.detect_win(graphics_state, this.win_location);
//         if(this.game_status){
//                 this.shapes.box.draw( graphics_state, Mat4.identity().times(Mat4.scale([10,10,10])), this.plastic);
//         }
      } 
      get_keynum()
      {
        let num_key = 0;
        if(this.key_1 && this.key_2)
                num_key=2;
        else if(this.key_1 || this.key_2)
                num_key=1;
        else
                num_key=0;
	    document.getElementById("key").innerHTML="Keys: "+num_key;
      }
      get_info(time){
//         let cur_time=this.graphics_state.animation_time/1000;
        document.getElementById("time").innerHTML="Timer: "+time.toFixed(2)+" s";
        document.getElementById("lives").innerHTML="Lives: ";
        document.getElementById("heart1").style.display="inline";
        if(this.health < 1){
           document.getElementById("heart1").style.display="none";   
           document.getElementById("die").style.display="inline";
           this.game_status = false;
        }
        document.getElementById("heart2").style.display="inline";
        if(this.health < 2){
           document.getElementById("heart2").style.display="none";   
        }
        document.getElementById("heart3").style.display="inline";
        if(this.health < 3){
           document.getElementById("heart3").style.display="none"; 
        }
      }
  }
