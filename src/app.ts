import * as THREE from 'three';
import * as CANNON from 'cannon';
import OrbitControls from 'three-orbitcontrols';
import DragControls from 'three-dragcontrols';
import { WebGLRenderer, Scene, PerspectiveCamera } from 'three';

export class App {
  message = 'Det här är en ugn';
  ugnsKartaWidth = 800;
  ugnsKartaHeight = 400;
  renderer:WebGLRenderer;
  scene:Scene;
  world:CANNON.World;
  body;
  body2;
  timeStep: number = 1/60;
  camera:PerspectiveCamera;
  controls:OrbitControls;
  ugnscanvas;
  mesh: THREE.Mesh;
  cylmesh: THREE.Mesh;
  ugnMesh: THREE.Mesh;
  contacts: number = 0;
  public dragControls;
  public meshObjectsInUgn: THREE.Mesh[] = [];
  
  attached() {
    this.init();
    this.initCannon();
    this.render();
    this.animate();
    //this.render();
  }
  
  public init = () => {
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
    this.camera.position.x = 5;
    this.camera.position.y = 5;
    this.camera.position.z = 5;
    this.camera.lookAt(this.scene.position);
    this.camera.up.set(0,0,1);

    this.scene.add(this.camera); // required, since adding light as child of camera
    
    // controls - rotation av ugnen
    this.controls = new OrbitControls(this.camera, this.ugnscanvas);
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 2;
    
    // ambient
    this.scene.add(new THREE.AmbientLight(0x444444));
    
    // light
    var light = new THREE.PointLight(0xffffff, 0.8);
    this.camera.add(light);


    this.createUgnBox();

    var beam = this.createIndividMesh(5.2,1.0,0.4,false);
    beam.position.x = -2.5 + 0.5 + 0.1;
    beam.position.y = -1.0 + 0.2 + 0.1;
    beam.position.z = 0;
    this.meshObjectsInUgn.push(beam);
    beam.rotation.x = Math.PI / 2;

    this.scene.add(beam);
    this.mesh = beam;
    
    var cyl = this.createIndividMesh(3.0,1.0,0.4,true);
    cyl.position.x = -2.5 + 2.5 + 0.1;
    cyl.position.y = -1.0 + 0.4 + 0.1;
    cyl.position.z = 1.0;
    this.meshObjectsInUgn.push(cyl);
    cyl.rotation.x = Math.PI / 2;

    this.scene.add(cyl);
    this.cylmesh = cyl;

    this.addEventListenersForIndivids();
    
    var axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    
    var grid = new THREE.GridHelper(100, 10);
    grid.rotation.x = Math.PI / 2;
    this.scene.add(grid);
    
  }

  public render = () => {
    this.renderer.render(this.scene, this.camera);
   // requestAnimationFrame(this.render);
  }

  public animate = () => {
    requestAnimationFrame( this.animate );
    this.updatePhysics();
    this.render();
  }

  public updatePhysics = () => {
    // Step the physics world
    this.world.step(this.timeStep);

    // Copy coordinates from Cannon.js to Three.js
    var cannonRules = false;
    if(cannonRules) {
      this.mesh.position.copy(this.body.position);
      this.mesh.quaternion.copy(this.body.quaternion);
      this.cylmesh.position.copy(this.body2.position);
      this.cylmesh.quaternion.copy(this.body2.quaternion);
    } else {
    // Three styr position
      this.body.position.copy(this.mesh.position);
      this.body.quaternion.copy(this.mesh.quaternion);

      this.body2.position.copy(this.cylmesh.position);
      this.body2.quaternion.copy(this.cylmesh.quaternion);
    }
}

 public initCannon = () => {
    this.world = new CANNON.World();
    this.world.gravity.set(0,0,-9.82);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 1;

    this.world.defaultContactMaterial.contactEquationStiffness = 1e6;
    this.world.defaultContactMaterial.contactEquationRelaxation = 10;
    var shape = new CANNON.Box(new CANNON.Vec3(5.2,1.0,0.4)); // Halfvector
    this.body = new CANNON.Body({ mass: 1 });
    this.body.addShape(shape);
    this.body.angularVelocity.set(0,0,0);
    this.body.velocity.set(0,0,0);
    this.body.angularDamping = 0;
    this.world.addBody(this.body);

    var shape2 = new CANNON.Box(new CANNON.Vec3(3.0,1.0,0.4)); // Halfvector
    this.body2 = new CANNON.Body({ mass: 1 });
    this.body2.addShape(shape2);
    this.body2.angularVelocity.set(0,0,0);
    this.body2.velocity.set(0,0,0);
    this.body2.angularDamping = 0.5;
    this.world.addBody(this.body2);

    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({
        mass: 0
    });
    groundBody.addShape(groundShape);

    this.world.addBody(groundBody);

    this.body2.addEventListener("collide",function(e){
      //console.log("The sphere just collided with the ground!");

      if(e.contact) {
        console.log("Contact between bodies:",e.contact);
      }

      if(e.body)
        console.log("Collided with body:",e.body);
    });

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
    //me.ugnMesh.scale.set(me.scale, me.scale, me.scale);

    me.ugnMesh.rotation.x = Math.PI / 2;
    
    me.scene.add(me.ugnMesh);

    
  }
  
  /*
  public createOldIndivid = (individOperation: Contract.IndividOperation) => {
    var me = this;
    
    var individMesh = me.createIndividMesh(individOperation);
    if (individMesh) {
      individMesh.position.set(individOperation.CentrumX * me.scale, individOperation.CentrumY * me.scale, individOperation.CentrumZ * me.scale);
      individMesh.rotation.set(THREE.Math.degToRad(individOperation.RotationX), THREE.Math.degToRad(individOperation.RotationY), THREE.Math.degToRad(individOperation.RotationZ));
      me.calculateUgnsKantForIndivid(individOperation, individMesh);
      
      me.scene.add(individMesh);
      
      me.meshObjectsInUgn.push(individMesh);
      me.individOperationsInUgn.push(individOperation);
    }
  }
  
  public createNewIndivid = (individOperation: Contract.IndividOperation, okToCreateIndivid: boolean) => {
    var me = this;
    
    if (okToCreateIndivid) { //om den ej redan finns
      var individMesh = this.createIndividMesh(individOperation);
      if (individMesh) {
        me.calculateUgnsKantForIndivid(individOperation, individMesh);
        individMesh.position.set(-(<any>individMesh).limit_x, -(<any>individMesh).limit_y, -(<any>individMesh).limit_z); //positionera i hörnet vid start 
        
        me.scene.add(individMesh);
        
        me.meshObjectsInUgn.push(individMesh);
        me.individOperationsInUgn.push(individOperation);
        me.addEventListenersForIndivids();
        me.checkObjectCollisions(individMesh, 0);
        me.checkWallCollision(individMesh);
      }
    }
  }
  */
//  private createIndividMesh(individOperation: Contract.IndividOperation) {
  private createIndividMesh(l, b, h, rund) {
    var me = this;
    var individBox;
    var individOperation = { Bredd: b, Langd: l, Hojd: h, IsRunt: rund}
    
    if (individOperation.IsRunt) {
      // let shape = new THREE.Shape();

      // shape.lineTo(individOperation.Bredd, 0);
      // shape.lineTo(individOperation.Bredd/2, individOperation.Hojd);
      // shape.lineTo(0, 0);

      // individBox = new THREE.ExtrudeGeometry(shape, {
      //     bevelEnabled: false,
      //     amount: individOperation.Langd
      // }); 

      individBox = new THREE.CylinderGeometry(individOperation.Bredd / 2, individOperation.Bredd / 2, individOperation.Langd, 50);
      individBox.rotateX(THREE.Math.degToRad(90)); //börja med geometrin liggandes
    }
    else {
      // geometry
      individBox = new THREE.BoxGeometry(individOperation.Bredd, individOperation.Hojd, individOperation.Langd);
    }
    
   //individBox.computeBoundingBox();
    
    // material
    var material = new THREE.MeshPhongMaterial({
      color: 'darkorange'
    });
    
    // mesh
    var individMesh = new THREE.Mesh(individBox, material);
    //individMesh.scale.set(me.scale, me.scale, me.scale);
    
    return individMesh;
  }
  
  public addEventListenersForIndivids = () => {
    var me = this;
    //me.removeEventListenersForIndivids();
    
    me.dragControls = new DragControls(me.meshObjectsInUgn, me.camera, me.ugnscanvas);
    me.dragControls.addEventListener('dragstart', function (e) {
       //me.body.velocity.set(5,5,5);
       me.moveStartCallback(e, me); 
    });
   // me.dragControls.addEventListener('drag', me.moveCallback);
   // me.dragControls.addEventListener('dragend', me.moveEndCallback);
  }
  
  /*
  public removeEventListenersForIndivids = () => {
    var me = this;
    
    if (me.dragControls) {
      me.dragControls.removeEventListener('dragstart', function (e) { me.moveStartCallback(e, me); });
      me.dragControls.removeEventListener('drag', me.moveCallback);
      me.dragControls.removeEventListener('dragend', me.moveEndCallback);
      me.dragControls.dispose();
    }
  }
  
  public removeIndivid = (individOperation: Contract.IndividOperation) => {
    var me = this;
    
    var index = me.individOperationsInUgn.findIndex(x => x.Id == individOperation.Id);
    if (index > -1) {
      
      me.individOperationsInUgn.splice(index, 1);
      
      var mesh = me.meshObjectsInUgn[index];
      
      //ta bort mesh från scene
      me.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh = undefined;
      
      me.meshObjectsInUgn.splice(index, 1);
    }
  }
  
  
  private calculateUgnsKantForIndivid(individOperation, individMesh: THREE.Mesh) {
    var me = this;
    var ugnBox = me.ugnMesh.geometry.boundingBox.max;
    
    var clone = individMesh.geometry.clone();
    
    clone.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(individMesh.rotation));
    clone.computeBoundingBox();
    
    var individBox = clone.boundingBox.max;
    
    var ugnsKantX = (ugnBox.x - individBox.x) * me.scale;
    var ugnsKantY = (ugnBox.y - individBox.y) * me.scale;
    var ugnsKantZ = (ugnBox.z - individBox.z) * me.scale;
    
    (<any>individMesh).limit_x = ugnsKantX;
    (<any>individMesh).limit_y = ugnsKantY;
    (<any>individMesh).limit_z = ugnsKantZ;
    
    clone.dispose(); 
    return individBox;
  }
  
  private calculateCollisonEdgeForIndivid(collisionMesh: THREE.Mesh, movingMesh: THREE.Mesh) {
    var me = this;
    var cloneCollision = collisionMesh.geometry.clone();
    var cloneMoving = movingMesh.geometry.clone();
    
    cloneMoving.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(movingMesh.rotation));
    cloneMoving.computeBoundingBox();
    cloneCollision.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(collisionMesh.rotation));
    cloneCollision.computeBoundingBox();
    
    var movingBoxHeight: number = me.roundUp(cloneMoving.boundingBox.max.y,3) * me.scale;
    var collisionBoxHeight: number = me.roundUp(cloneCollision.boundingBox.max.y,3) * me.scale;
    
    
    var yUpper = me.roundUp(collisionMesh.position.y + movingBoxHeight + collisionBoxHeight, 3) + 0.001;
    
    //if (isRound) {
    //     //om en rund och en rektangulär
    //    movingMesh.position.y = Number(yUpper.toString().substring(0, yUpper.toString().indexOf(".") + 3));
    //}
    //else {
    //om rektangulära
    //var yUpper = collisionMesh.position.y + (individCollisionBox.y * me.scale) + (individMovingBox.y * me.scale);
    movingMesh.position.y = yUpper;
    //}
    
    
    cloneMoving.dispose();
    cloneCollision.dispose();
    
    me.checkWallCollision(movingMesh);
  }
  
  private roundUp(num, precision) {
    precision = Math.pow(10, precision)
    return Math.ceil(num * precision) / precision;
  }
  
  
  */
  private moveStartCallback = (event, me) => {
    me.originPoint = event.object.position.clone();
    //me.parent.setIsDirty(true); //tala om att vyn är dirty ifall en individ har flyttats       
    //this.controls.enabled = false; //så man ej kan flytta ugnen när man flyttar en individ
    
    //if (me.selectedMeshIndivid != event.object)
    //me.setSelectedIndivid(event.object, null);
  }
  /*
  private moveCallback = (event) => {
    this.checkWallCollision(event.object);
  }
  
  
  private moveEndCallback = (event) => {
    this.controls.enabled = true;
    
    this.checkObjectCollisions(event.object, 0);
  }
  
  
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
