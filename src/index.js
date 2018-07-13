const IPFS = require('ipfs');
var ipfsAPI = require('ipfs-api');

// const IPFS = require('ipfs-api');
// const adv_node = new IPFS({ 
//   host: 'ipfs.infura.io', 
//   port: 5001, 
//   protocol: 'https',
  
// });

// console.log(adv_node);

const adv_node = new IPFS({ 
  repo: 'ipfs-' + Math.random(),
  EXPERIMENTAL: {
    pubsub: true,
  },
  config: {
    Addresses: {
      Swarm: [
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      ],
      API: '/ip4/35.200.191.253/tcp/5001',
      Gateway: '/ip4/35.200.191.253/tcp/8080'
    },
    Discovery: {
      MDNS: {
        Enabled: true,
        Interval: 10
      },
      webRTCStar: {
        Enabled: true
      }
    },
  }
});

// var date = new Date(); 
// var ad_id;
// var request_ts;
// var response_obj;

adv_node.on('error', err => console.error(err));

adv_node.on('ready', () => adv_node.id((err, info) => {
  if (err) { throw err };
  console.log('Online status: ', adv_node.isOnline() ? 'online' : 'offline');
  console.log('IPFS node ready with id: ' + info.id);
  setInterval(() => checkPeers(adv_node, topic), 3000);
  
  const topic = 'publisher:ads:localhost';  

  var ad_id;
  var request_ts;
  var response_obj;

  const receiveMsg = (msg) => {
    console.log(msg.data.toString());
    var request_obj = JSON.parse(msg.data.toString());
    ad_id = request_obj.ad_id;
    request_ts = request_obj.req_ts; 
    if (request_obj.type == 'request') {
      response_obj = generateAdResponse(ad_id, request_ts);
      console.log(response_obj);
      publishAdResponse(topic, response_obj);
    }
  }  

  // function receiveMsg2(msg){
  //   console.log(msg.data.toString());
  //   var request_obj = JSON.parse(msg.data.toString());
  //   ad_id = request_obj.ad_id;
  //   request_ts = request_obj.req_ts; 
  //   response_obj = generateAdResponse(ad_id, request_ts);
  //   console.log(response_obj);
  //   publishAdResponse(topic, response_obj);
  // }

  // const msg = Buffer.from(JSON.stringify(response_obj));

  adv_node.pubsub.subscribe(topic, receiveMsg, (err) => {
    if (err) { throw err };
    console.log(`subscribed to ${topic}`)
  });

  // setInterval(() => publishAdResponse(topic, response_obj), 3000);
}));

function publishAdResponse(topic, response_obj) {
  const adResponse = JSON.stringify(response_obj);
  console.log(">> Ad Response: ", adResponse);
  const adResponseBuffer = Buffer.from(adResponse);
  adv_node.pubsub.publish(topic, adResponseBuffer, (err) => {
    if (err) { throw err };
    console.log(`[INFO] Ad Response sent to: ${topic} & ${adResponse}`);
  });
}

function generateAdResponse(ad_id, request_ts) {
  // console.log('ad_id and req_ts: ' + ad_id + " " + request_ts);
  // date and bid value evaluation
  const MIN_BID = 0.0;
  const MAX_BID =1.0;
  var bidVal = Number((Math.random() * (MAX_BID - MIN_BID) + MIN_BID).toFixed(2));
  
  var response_obj = {
    type:"response", 
    ad_id:ad_id, 
    req_ts:request_ts, 
    resp_ts: Date.now(), 
    bid:bidVal
  };

  // console.log(response_obj);

  return response_obj;
}

function checkPeers(node, topic) {
  node.pubsub.peers(topic, (err, peerIds) => {
    if (err) { throw err };
    console.log('[INFO] Looking for peers (topic): ', peerIds)
  });
  node.swarm.peers({}, function(err, peers) {
    if (err) { throw err }; 
    console.log('[INFO] Looking for peers: ', peers)
  });
}