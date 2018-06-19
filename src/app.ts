import * as THREE from 'three';
import * as CANNON from 'cannon';
import * as THREED from 'cannon/tools/threejs/CannonDebugRenderer';
import OrbitControls from 'three-orbitcontrols';
import DragControls from 'three-dragcontrols';
import { WebGLRenderer, Scene, PerspectiveCamera, Vector3 } from 'three';

export class App {
  message = 'Det här är en ugn';
  ugnsKartaWidth = 1000;
  ugnsKartaHeight = 600;
  renderer:WebGLRenderer;
  scene:Scene;
  world:CANNON.World;
  ugnMesh;
  timeStep: number = 1/60;
  camera:PerspectiveCamera;
  controls:OrbitControls;
  ugnscanvas;
  public dragControls;
  public meshObjectsInUgn: THREE.Mesh[] = [];
  public inUgn: {mesh: THREE.Mesh, phys: any}[] = [];
  rayCaster = new THREE.Raycaster();
  
  attached() {
    this.initThree();
    this.initCannon();
    this.addMaterial();
    //this.debugr = THREED.CannonDebugRenderer(this.scene, this.world);
    this.animate();
    //this.render();
  }
  
  public addMaterial = () => {
    var individ = this.createIndivid(5.2,1.0,0.4,false);
    var beam = individ.mesh;
    beam.position.x = -2.5 + 0.5 + 0.1; 
    beam.position.y = 0;
    beam.position.z = 0.2 + 0.1;
    this.meshObjectsInUgn.push(beam);
    this.inUgn.push(individ);
 
    individ = this.createIndivid(5.2,1.0,0.4,false);
    var beam = individ.mesh;
    beam.position.x = -2.5 + 0.5 + 0.1; 
    beam.position.y = 0;
    beam.position.z = 0.2 + 0.2 + 0.3;
    this.meshObjectsInUgn.push(beam);
    this.inUgn.push(individ);

    // Mellanlägg
    individ = this.createIndivid(7.0,0.5,0.05,false);
    var beam = individ.mesh;
    beam.position.x = -2.5 + 0.5 + 0.1; 
    beam.position.y = 0;
    beam.position.z = 0.2 + 0.1;
    this.meshObjectsInUgn.push(beam);
    var m = new THREE.MeshStandardMaterial({color: 'blue', metalness: 0.5, roughness: 0.5 });
    individ.mesh.material = m;
    this.inUgn.push(individ);

    individ = this.createIndivid(3.0,0.5,0,true);
    var cyl = individ.mesh;
    cyl.position.x = 0;
    cyl.position.y = 0;
    cyl.position.z = 0.4 + 0.1;
    this.meshObjectsInUgn.push(cyl);
    this.inUgn.push(individ);

    individ = this.createIndivid(3.0,0.5,0,true);
    var cyl = individ.mesh;
    cyl.position.x = 1.0;
    cyl.position.y = 0;
    cyl.position.z = 0.4 + 0.1;
    this.meshObjectsInUgn.push(cyl);
    this.inUgn.push(individ);

    individ = this.createIndivid(3.0,0.5,0,true);
    var cyl = individ.mesh;
    cyl.position.x = 1.5;
    cyl.position.y = 0;
    cyl.position.z = 0.4 + 0.1;
    this.meshObjectsInUgn.push(cyl);
    this.inUgn.push(individ);

    this.inUgn.forEach(element => {
      this.scene.add(element.mesh);
      this.world.addBody(element.phys);

      element.phys.position.copy(element.mesh.position);
      element.phys.quaternion.copy(element.mesh.quaternion);

      var id = this.makeTextSprite(element.mesh.id + "",'');  
      id.position.set(-.4,2,0);    
      element.mesh.add(id);
    });

  }

  public makeTextSprite(message, parameters) {
    var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Arial";
    var fontsize = 40;
  
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = fontsize + "px " + fontface;
    context.fillStyle = 'black';
    context.fillText(message, 0, 40);
  
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
  
    var spriteMaterial = new THREE.SpriteMaterial({map: texture});
    var sprite = new THREE.Sprite(spriteMaterial);
    return sprite;
  }

  public initThree = () => {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.ugnscanvas,
      alpha: true,     // transparent background
      antialias: true // smooth edges
    });
    this.renderer.setSize(this.ugnsKartaWidth, this.ugnsKartaHeight);
    this.renderer.setClearColor(0x889988);
    
    // scene
    this.scene = new THREE.Scene();
    
    // camera
    this.camera = new THREE.PerspectiveCamera(45, this.ugnsKartaWidth / this.ugnsKartaHeight,1, 1000);
    this.camera.position.x = -2;
    this.camera.position.y = 7;
    this.camera.position.z = 1;
    this.camera.lookAt(this.scene.position);
    this.camera.up.set(0,0,1);
    
    // controls - rotation av ugnen
    this.controls = new OrbitControls(this.camera, this.ugnscanvas);
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.disable;
    
    var light = new THREE.PointLight(0xffffff, 0.8);
    this.camera.add(light);

    this.createUgnBox();

    var axesHelper = new THREE.AxesHelper(5);

    this.scene.add(new THREE.AmbientLight(0x444444));
    this.scene.add(this.camera); // required, since adding light as child of camera

    this.addEventListenersForIndivids();
    
  }

  public render = () => {
    this.renderer.render(this.scene, this.camera);
  }

  public animate = () => {
    requestAnimationFrame( this.animate );
    //this.debugr.update();
    this.updatePhysics();
    this.render();
  }

  public updatePhysics = () => {
    // Step the physics world
    this.world.step(this.timeStep);

    for (const material of this.inUgn) {
      material.mesh.position.copy(material.phys.position);
      material.mesh.quaternion.copy(material.phys.quaternion);
    }

  }

 public initCannon = () => {
    this.world = new CANNON.World();
    this.world.gravity.set(0,0,0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;

    this.world.defaultContactMaterial.contactEquationStiffness = 1e6;
    this.world.defaultContactMaterial.contactEquationRelaxation = 1;

    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    this.world.addBody(groundBody);

    this.world.addEventListener("postStep",function(e){
      // No one moves!
      for (const material of this.inUgn) {
        material.phys.velocity.setZero();
        material.phys.angularVelocity.setZero();
      }
    }.bind(this));

}
  private createUgnBox = () => {
    var me = this;
    
    var ugnWidth = 5;
    var ugnHeight = 2;
    var ugnLength = 7;
    
    var defaultMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: false,
      side: THREE.BackSide
    });
    
    var frontMaterial = new THREE.MeshPhongMaterial({
      color: 0x595959,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    var materials = [defaultMaterial, // Left side
      defaultMaterial, // Right side
      defaultMaterial, // Top side   
      defaultMaterial, // Bottom side 
      frontMaterial, // Front side
      defaultMaterial  // Back side
    ];
    
    // ugnen 
    var ugnBox = new THREE.BoxGeometry(ugnWidth, ugnHeight, ugnLength);
    ugnBox.computeBoundingBox();
    
    // mesh
    me.ugnMesh = new THREE.Mesh(ugnBox, (<any>materials));
    me.ugnMesh.position.x = 0;
    me.ugnMesh.position.y = 0;
    me.ugnMesh.position.z = 1.0;
    me.ugnMesh.rotation.x = Math.PI / 2;
    
    me.scene.add(me.ugnMesh);
    
  }
  
//  private createIndividMesh(individOperation: Contract.IndividOperation) {
  private createIndivid(l, b, h, rund) {
    var me = this;
    var individBox;
    var physicObj;
    var individOperation = { Bredd: b, Langd: l, Hojd: h, IsRunt: rund}
    
    if (individOperation.IsRunt) {
      individBox = new THREE.CylinderGeometry(individOperation.Bredd / 2, individOperation.Bredd / 2, individOperation.Langd, 24);
      let shape = new CANNON.Cylinder(individOperation.Bredd / 2, individOperation.Bredd / 2, individOperation.Langd, 24);
      physicObj = new CANNON.Body({ mass: 1 });
      physicObj.fixedRotation = true;
      physicObj.addShape(shape);
  
      // Rotate cannon.js cyl to match three.js
      // https://github.com/schteppe/cannon.js/issues/58
      var quat = new CANNON.Quaternion();
      quat.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
      var translation = new CANNON.Vec3(0,0,0);
      physicObj.shapes[0].transformAllPoints(translation,quat);

      physicObj.fixedRotation = true;

    }
    else {
      individBox = new THREE.BoxGeometry(individOperation.Bredd, individOperation.Langd, individOperation.Hojd ); 
      let shape = new CANNON.Box(new CANNON.Vec3(individOperation.Bredd/2, individOperation.Langd/2, individOperation.Hojd/2)); // Halfvector
      physicObj = new CANNON.Body({ mass: 1 });
      physicObj.fixedRotation = true;
      physicObj.addShape(shape);
    }
    
    individBox.computeBoundingBox();
    
    // material
    var material = new THREE.MeshStandardMaterial({color: 'darkorange', metalness: 0.5, roughness: 0.5 });
    
    // mesh
    var individMesh = new THREE.Mesh(individBox, material);
    
    return {mesh: individMesh, phys: physicObj};
  }
  
  public addEventListenersForIndivids = () => {
    var me = this;
    //me.removeEventListenersForIndivids();
    
    me.dragControls = new DragControls(me.meshObjectsInUgn, me.camera, me.ugnscanvas);
    me.dragControls.addEventListener('drag', function (e) {
      me.moveStartCallback(e, me); 

      for (const material of me.inUgn) {

        if(e.object.id == material.mesh.id) {
          material.phys.position.copy(material.mesh.position);
          material.phys.quaternion.copy(material.mesh.quaternion);
        //   material.phys.mass = 1;
        //   material.phys.updateMassProperties();
        } //else {
        //   material.phys.mass = 0;
        //   material.phys.updateMassProperties();        
        // }
      }

      me.world.step(me.timeStep);
    });
    me.dragControls.addEventListener('dragend', function (e) {me.moveEndCallback(e)});

  }

  private moveStartCallback = (event, me) => {
    me.originPoint = event.object.position.clone();
    //me.parent.setIsDirty(true); //tala om att vyn är dirty ifall en individ har flyttats       
    this.controls.enabled = false; //så man ej kan flytta ugnen när man flyttar en individ
    
    //if (me.selectedMeshIndivid != event.object)
    //me.setSelectedIndivid(event.object, null);
  }
  /*
  private moveCallback = (event) => {
    this.checkWallCollision(event.object);
  }
  */
  
  private moveEndCallback = (event) => {
    this.controls.enabled = true;
    
  }
  
  /*
  public setSelectedIndivid(mesh: THREE.Mesh, individOperation: Contract.IndividOperation) {
    this.clearSelectedIndividInUgn();
    
    if (mesh) { //om vald via ugnskartan
      this.parent.selectedIndividOperation = null;
      
      var meshIndex = this.meshObjectsInUgn.findIndex(x => x.id == mesh.id);
      individOperation = this.individOperationsInUgn[meshIndex];
      this.selectIndividInUgn(mesh, individOperation);
      this.parent.selectGridRowFromIndivid(this.parent, individOperation);
    }
    else { //om vald via grid
      var individIndex = this.individOperationsInUgn.findIndex(x => x.Id == individOperation.Id);
      if (individIndex > -1) { //kolla att individen finns i ugnen
        mesh = this.meshObjectsInUgn[individIndex];
        this.selectIndividInUgn(mesh, individOperation);
      }
      
    }
  }
  
  private clearSelectedIndividInUgn() {
    if (this.selectedMeshIndivid)
    this.selectedMeshIndivid.children = []; //remove wireframe
    
    this.selectedMeshIndivid = null;
    this.selectedIndividOperation = null;
    
  }
  
  private selectIndividInUgn(mesh: THREE.Mesh, individOperation: Contract.IndividOperation) {
    this.selectedMeshIndivid = mesh;
    this.selectedIndividOperation = individOperation;
    this.addWireFrameForSelectedMesh(this.selectedMeshIndivid);
  }
  
  private addWireFrameForSelectedMesh(mesh: THREE.Mesh) {
    var geometry = new THREE.WireframeGeometry(mesh.geometry); // or WireframeGeometry
    var material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    var edges = new THREE.LineSegments(geometry, material);
    mesh.add(edges); // add wireframe as a child of the parent mesh
  }
  
  
  private checkWallCollision = (mesh) => {
    var me = this;
    
    if (mesh.position.x > mesh.limit_x) {
      mesh.position.x = mesh.limit_x;
    }
    else if (mesh.position.x < -mesh.limit_x) {
      mesh.position.x = -mesh.limit_x;
    }
    if (mesh.position.y > mesh.limit_y) {
      mesh.position.y = mesh.limit_y;
    }
    else if (mesh.position.y < -mesh.limit_y) {
      mesh.position.y = -mesh.limit_y;
    }
    if (mesh.position.z > mesh.limit_z) {
      mesh.position.z = mesh.limit_z;
    }
    else if (mesh.position.z < -mesh.limit_z) {
      mesh.position.z = -mesh.limit_z;
    }
    
  }
  
  private checkObjectCollisions = (mesh:THREE.Mesh,  countPositionAttempt) => {
    var me = this;
    
    var otherMeshObjects = me.meshObjectsInUgn.slice(0);
    // var otherIndividObjects = me.individOperationsInUgn.slice(0);
    var index = otherMeshObjects.indexOf(mesh);
    if (index > -1) {
      otherMeshObjects.splice(index, 1);
      //   otherIndividObjects.splice(index, 1);
      // let isMeshRound: boolean = me.individOperationsInUgn[index].IsRunt;
      let collisionFound: boolean = false;
      
      for (var i = 0; i < otherMeshObjects.length; i++) {
        // let isOtherMeshRound: boolean = otherIndividObjects[i].IsRunt;
        var movingBox = new THREE.Box3().setFromObject(mesh);
        var otherBox = new THREE.Box3().setFromObject(otherMeshObjects[i]);
        var result = movingBox.intersect(otherBox);
        collisionFound = (result.max.x - result.min.x) * (result.max.y - result.min.y) * (result.max.z - result.min.z) > 0;
        
        //if (isOtherMeshRound && collisionFound) {
        //    mesh.geometry.computeBoundingSphere();
        //    collisionFound = me.isPointInsideSphere(movingBox, otherMeshObjects[i].position, mesh.geometry.boundingSphere.radius);
        //}
        
        
        if (collisionFound) {
          me.calculateCollisonEdgeForIndivid(otherMeshObjects[i], mesh);
          break;
        }
        
      }
      
      if (collisionFound) {
        if (countPositionAttempt < me.maxNumOfPositionAttempts) {
          countPositionAttempt += 1;
          me.checkObjectCollisions(mesh, countPositionAttempt);
        }
        else
        mesh.position.set(me.originPoint.x, me.originPoint.y, me.originPoint.z);
      }
    }
    
  }
  
  
  //private isPointInsideSphere(obj, centrum, radius) {
  //    var point = new THREE.Vector3();
  //    obj.clampPoint(centrum, point);
  
  //    var distance = point.distanceToSquared(centrum);
  //    return distance < (radius * radius);
  //}
  
  
  public rotate(axis) {
    if (this.selectedMeshIndivid && this.selectedIndividOperation) {
      if (axis === 'x')
      this.selectedMeshIndivid.rotateX(THREE.Math.degToRad(90));
      else if (axis === 'z')
      this.selectedMeshIndivid.rotateZ(THREE.Math.degToRad(90));
      else if (axis === 'y')
      this.selectedMeshIndivid.rotateY(THREE.Math.degToRad(90));
      
      if (this.individFitsInUgnAfterRotation(axis)) {
        this.checkObjectCollisions(this.selectedMeshIndivid, 0);
        this.checkWallCollision(this.selectedMeshIndivid);
        this.parent.setIsDirty(true);
      }
    }
  }
  
  private individFitsInUgnAfterRotation(axis) {
    //kolla om individen får plats i ugnen när den har roterats.
    //om individen är för stor i denna vinkel för att få plats rotera tillbaka individen
    var me = this;
    let fits: boolean = true;
    var ugnBox = me.ugnMesh.geometry.boundingBox.max;
    
    var individBox = me.calculateUgnsKantForIndivid(me.selectedIndividOperation, me.selectedMeshIndivid);
    if (ugnBox.x < individBox.x  || ugnBox.y < individBox.y || ugnBox.z < individBox.z) {
      fits = false;
    }
    
    if (axis === 'x' && !fits) {
      me.selectedMeshIndivid.rotateX(THREE.Math.degToRad(-90));
    }
    else if (axis === 'y' && !fits) {
      me.selectedMeshIndivid.rotateY(THREE.Math.degToRad(-90));
    }
    else if (axis === 'z' && !fits) {
      me.selectedMeshIndivid.rotateZ(THREE.Math.degToRad(-90));
    }
    
    if (!fits)
    me.calculateUgnsKantForIndivid(me.selectedIndividOperation, me.selectedMeshIndivid);
    
    return fits;
  }
  
  public getIndividPositions = (allIndividOperations: Contract.IndividOperation[]) => {
    
    var me = this;
    return new Promise<boolean>(function (resolve, reject) {
      //för varje individ kolla ifall den har en position och leta upp den i ugnen - spara
      for (var i = 0; i < allIndividOperations.length; i++) {
        if (allIndividOperations[i].Positionerad) {
          var index = me.individOperationsInUgn.findIndex(x => x.Id == allIndividOperations[i].Id);
          allIndividOperations[i].CentrumX = me.meshObjectsInUgn[index].position.x / me.scale;
          allIndividOperations[i].CentrumY = me.meshObjectsInUgn[index].position.y / me.scale;
          allIndividOperations[i].CentrumZ = me.meshObjectsInUgn[index].position.z / me.scale;
          
          allIndividOperations[i].RotationX = Math.round(THREE.Math.radToDeg(me.meshObjectsInUgn[index].rotation.x));
          allIndividOperations[i].RotationY = Math.round(THREE.Math.radToDeg(me.meshObjectsInUgn[index].rotation.y));
          allIndividOperations[i].RotationZ = Math.round(THREE.Math.radToDeg(me.meshObjectsInUgn[index].rotation.z));
        }
        else {
          allIndividOperations[i].CentrumX = null;
          allIndividOperations[i].CentrumY = null;
          allIndividOperations[i].CentrumZ = null;
          
          allIndividOperations[i].RotationX = null;
          allIndividOperations[i].RotationY = null;
          allIndividOperations[i].RotationZ = null;
        }
      }
      
      resolve(true);
    });
  }
  
  public disposeUgnsKarta() {
    var me = this;
    return new Promise<boolean>(function (resolve, reject) {
      me.removeEventListenersForIndivids();
      
      for (var i = 0; i < me.individOperationsInUgn.length; i++) {
        me.removeIndivid(me.individOperationsInUgn[i]);
      }
      
      me.scene.remove(me.ugnMesh);
      me.ugnMesh.geometry.dispose();
      
      
      if ((<any>me.ugnMesh.material).length > 0)
      (<any>me.ugnMesh.material).forEach(function (element) {
        element.dispose();
      });
      else
      me.ugnMesh.material.dispose();
      
      me.ugnMesh = null;
      me.selectedIndividOperation = null;
      me.selectedMeshIndivid = null;
      me.originPoint = null;
      me.scene = null;
      
      me.dragControls = null;
      me.operation = null;
      me.meshObjectsInUgn = [];
      me.individOperationsInUgn = [];
      me.individOperationsInUgn= [];
      me.controls = [];
      me.parent = null;
      me.renderer = null;
      me.camera = null;
      me.controls = null;
      
      cancelAnimationFrame(me.animationFrameId);
      
      resolve(true);
    });
  }
  
  //private physicsSimulation(meshObj:THREE.Mesh[]) {
  //    //var mass = 100; //kg
  //    //var gravity = mass * 9.81;
  
  //    for (var i = 0; i < meshObj.length; i++) {
  //        if (meshObj[i].position.y != -(<any>meshObj[i]).limit_y && this.controls.enabled)
  //        {
  //            meshObj[i].position.y = -(<any>meshObj[i]).limit_y;
  //        }
  
  //    }
  //}
  
  
  
  
  //private limitMoveToAxis(xyz) {
  //    if (xyz === undefined)
  //        xyz = 'xyz';
  
  //    this.moveX = this.moveY = this.moveZ = false;
  
  //    if (xyz.indexOf('x') > -1) {
  //        this.moveX = true;
  //    }
  
  //    if (xyz.indexOf('y') > -1) {
  //        this.moveY = true;
  //    }
  
  //    if (xyz.indexOf('z') > -1) {
  //        this.moveZ = true;
  //    }
  
  //    return this;
  //}
  
  
  
  
  //private intersectsXAngle(collisionBox: THREE.Box3, movingBox: THREE.Box3) {
  //    if ((movingBox.min.x > collisionBox.min.x && movingBox.min.x < collisionBox.max.x) ||
  //        (movingBox.max.x > collisionBox.min.x && movingBox.max.x < collisionBox.max.x)) 
  //        return false;
  //    else return true;
  //}
  
  //private intersectsYAngle(collisionBox: THREE.Box3, movingBox: THREE.Box3) {
  //    if ((movingBox.min.y > collisionBox.min.y && movingBox.min.y < collisionBox.max.y) ||
  //        (movingBox.max.y > collisionBox.min.y && movingBox.max.y < collisionBox.max.y)) 
  //        return false;
  //    else return true;
  //}
  
  //private intersectsZAngle(collisionBox: THREE.Box3, movingBox: THREE.Box3) {
  //    if ((movingBox.min.z > collisionBox.min.z && movingBox.min.z < collisionBox.max.z) ||
  //        (movingBox.max.z > collisionBox.min.z && movingBox.max.z < collisionBox.max.z)) 
  //        return false;
  //    else return true;
  //}
  
  
  
  //private xIntersection(collisionBox: THREE.Box3, movingBox: THREE.Box3) {
  //    if (movingBox.min.x > collisionBox.min.x && movingBox.min.x < collisionBox.max.x)
  //        return Math.abs(collisionBox.max.x - movingBox.min.x);
  //    else if (movingBox.max.x > collisionBox.min.x && movingBox.max.x < collisionBox.max.x)
  //        return Math.abs(movingBox.max.x - collisionBox.min.x);
  //    else return 0;
  //}
  
  //private yIntersection(collisionBox: THREE.Box3, movingBox: THREE.Box3) {
  //    if (movingBox.min.y > collisionBox.min.y && movingBox.min.y < collisionBox.max.y)
  //        return Math.abs(collisionBox.max.y - movingBox.min.y);
  //    else if (movingBox.max.y > collisionBox.min.y && movingBox.max.y < collisionBox.max.y)
  //        return Math.abs(movingBox.max.y - collisionBox.min.y);
  //    else return 0;
  //}
  
  
  
  
  //var xUpper = collisionMesh.position.x + (collisionBox.x * me.scale) + (individMovingBox.x * me.scale);
  //var xLower = collisionMesh.position.x - (collisionBox.x * me.scale) - (individMovingBox.x * me.scale);
  
  //var zUpper = collisionMesh.position.z + (collisionBox.z * me.scale) + (individMovingBox.z * me.scale);
  //var zLower = collisionMesh.position.z - (collisionBox.z * me.scale) - (individMovingBox.z * me.scale);
  
  
  //if (moveInYDirection) {
  //if (collisionMesh.position.y > movingMesh.position.y || movingMesh.position.y == (<any>movingMesh).limit_y)
  //    movingMesh.position.y = yLower;
  //else
  
  
  //private checkObjectCollisions2 = (mesh, countPositionAttempt) => {
  //    var me = this;
  
  //    var otherMeshObjects = me.meshObjectsInUgn.slice(0);
  //    var index = otherMeshObjects.indexOf(mesh);
  //    if (index > -1)
  //        otherMeshObjects.splice(index, 1);
  
  //    var origin = mesh.position.clone();
  
  //    for (var v = 0; v < mesh.geometry.vertices.length; v++) {
  //        var localVertex = mesh.geometry.vertices[v].clone();
  //        var globalVertex = localVertex.applyMatrix4(mesh.matrix);
  //        var directionVector = globalVertex.sub(mesh.position);
  
  
  //        var ray = new THREE.Raycaster(origin, directionVector.clone().normalize(), );
  //        var intersections = ray.intersectObjects(otherMeshObjects);
  //        if (intersections.length > 0 &&
  //            intersections[0].distance < directionVector.length()) {
  //            alert("Fatal collision!");    // definitely a collision
  //            return true;
  //        }
  //    }
  
  //}
  
  */
  
}
