/*
  Author: neotam <me@neot.am> 
  Copytright 2020 neotam 
  Licensed under MIT
*/

$(
  () => {
    console.log(";on load;");
    $('#ip_address').on('input', e=>updateCIDR()); 
    $('#prefix').on('input', e=>updateCIDR()); 
    window.cidr = new CIDRBlock(); 
    $("#calculate").on('click', e=>updateCIDR()); 

    //tooltip activate
    $('[data-toggle="tooltip"]').tooltip(); 

    //Bits to represent IP in binary 
    const bt = new BT(); 
    window.bt = bt; 
    bt.renderBits($('#ipBits')); 
    window.mask = new NetmaskNotation()
  }
)

function updateCIDR(){
  console.log("Updating CIDR");
  var ip = $('#ip_address').val(); 
  var prefix = $('#prefix').val();
  var networkaddr = cidr.getFirstAddress(ip, prefix); 
  $('#firstip').val(networkaddr); 
  var broadcastaddr = cidr.getLastAddress(ip, prefix);
  $('#lastip').val(broadcastaddr); 

  $("#ipCount").text(cidr.getIPCount(prefix));
  $("#hostCount").text(cidr.getHostCount(prefix));

  $('#fromhostip').val(cidr.getFirstHostAddr(prefix));  
  $('#tohostip').val(cidr.getLastHostAddr(prefix));  
  updateMask(prefix);
}

function updateMask(prefix){
    mask.prefix_length = prefix; 
    $('#netmask').val(mask.dottedDecimal);
    $('#wildcardmask').val(mask.wildcardDotDecimal);
}

class CIDRBlock {
  prefix_length = null; 

  constructor(err,){
    this.errback = err; 
  }

  get firstAddr(){
    let ip = $('#ip_address').val();
    let mask = $('#prefix').val();
    return this.getFirstAddress(ip, mask)
  }

  get lastAddr() {
    let ip = $('#ip_address').val();
    let mask = $('#prefix').val();
    return this.getLastAddress(ip, mask)
  }

  getFirstAddress(ip, mask){
      if (mask > 32 ){
        // invalid prefix 
        let msg = 'Invalid prefix';
        console.error(msg); 
        this.errback(msg);
        return 
      }
      this.prefix_length = mask;
      return this.comptueNetwokAddress(ip, this.prefix_length); 
  }

  comptueNetwokAddress (ip, prefix_length) {
    var ipint =  ip2int(ip) 
    var mask  = (-1 << (32 - prefix_length)) >>> 0;  //convert signed to unsiged with >>>
    return int2ip(ipint & mask);
  }

  getLastAddress(ip, mask){
    if (mask > 32 ){
      // invalid prefix 
      let msg = 'Invalid prefix';
      console.error(msg); 
      this.errback(msg);
      return 
    }
    this.prefix_length = mask;
    return this.computeBroadcastAddr(ip, this.prefix_length); 
  }

  computeBroadcastAddr (ip, prefix_length) {
    var ipint = ip2int(ip);
    var host_mask  = parseInt('1'.repeat(32-prefix_length), 2); 
    return int2ip(ipint | host_mask);
  }

  getIPCount(prefix_length) {
    // Return the total number of addresses in the CIDR Block 
    const suffix = 32 - prefix_length; 
    return 2 ** suffix;

  }

  getHostCount(prefix_length) {
    // Return the total number of hosts or usable addrasses in the block 
    let hc = this.getIPCount(prefix_length) - 2; 
    return hc < 1 ? 1 : hc; 

  }

  getFirstHostAddr(prefix_length){
    if (prefix_length == 32) 
      return this.firstAddr;
    return int2ip(ip2int(this.firstAddr) + 1); 
  }

  getLastHostAddr(prefix_length){
    if (prefix_length == 32)
      return this.lastAddr;
    return int2ip(ip2int(this.lastAddr) - 1); 
  }

}


class BT {
  constructor() {
    this.updateDisplay = this.updateDisplay.bind(this); 
    this.onBitClick = this.onBitClick.bind(this); 
    
  }

  renderBits(container){
    container = typeof(container) === 'string' ? $(`#${container}`) : container; 
    var c = 0; 
    let dword = '';
    // let bytes = '';                  //Pit Fall: Using let in wrong place
    for(let i=1; i <= 2; i++) {
      let word = '', bytes='';
      for(let j=1; j <= 2; j++) {
        let byte = '',  bit=''; 
        for (let b=0; b < 8; b ++) {
              bit += `<div class="btn bit bit-value bg-info text-white border-dark p-1 flex-fill" data-bit="${c}" style="font-size:.8em" id="bit_${c}"> 1 </div>`;
                c++; 
                  //  bits += `<div class="nibble col-lg-6 col-md-12 py-2"> <div class="d-flex flex-row-reverse"> ${nibble}  </div></div>`; 
          }
          byte += `<div class="byte col-md-6 col-lg-6 "> <div class="d-flex flex-row-reverse"> ${bit} </div> </div>`; 
          bytes += byte; 
      }
      word += `<div class="word row col-sm-12 col-md-12 col-lg-6 flex-md-row-reverse flex-column-reverse  no-gutters">  ${bytes}  </div>`; 
      dword += word; 
    }
    container.addClass('row flex-lg-row-reverse flex-column-reverse no-gutters mt-n3 mt-lg-0');
    container.html(dword); 
    this.registerEvents(); 
  }

  registerEvents(){
    $('.bit').on('click', this.onBitClick); 
    // Array.from(document.getElementsByClassName('bit')).forEach( e => e.addEventListener('click', this.onBitClick, true));
  }

  onBitClick(e){
    const bit = e.currentTarget.dataset.bit; 
    const ele = $(`#${e.currentTarget.id} `)
    const text = $(ele).text() === '1'? '0' : '1'; 
    $(ele).text(text); 
    console.log('clicked', bit); 
    this.updateDisplay(); 
  }

  updateDisplay() {
    console.log('Display Update'); 
    const s = this.bitstring.replace(/^0*/, '');
    const bs = s ? s : 0; 
    // this.updateIPAddress(bs);
    
  }

  updateIPAddress(bs) {
    var ips = int2ip(parseInt(bs, 2));
    $('#ipaddr').val(ips);
  }

  get bitstring() {
    const bs = [...$('.bit-value').text()].reverse().join(''); 
    return bs; 
  }
}

class NetmaskNotation {
  #prefix_length = null; 

  constructor(prefix, errback){
    this.errback = errback; 
    this.#prefix_length = prefix; 
    
  }

  get prefix_length() {
    return this.#prefix_length; 
  }

  set prefix_length(prefix) {
    var prefix = parseInt(prefix);
    console.log("setting prefix");
    if (!this.isValidPrefix(prefix)){
      console.error(`Invalid Prefix Length ${prefix}`);
      return; 
    }
    this.#prefix_length = prefix; 
  }

  get dottedDecimal(){
    return int2ip(this.decimalMask); 
  }

  get hexaDecimal() {
    var hex_mask = this.decimalMask.toString(16).toUpperCase();
    return hex_mask.match(/.{1,2}/g).join(" ");
  }

  get binMask() {
    return this.decimalMask.toString(2).match(/.{1,8}/g).join(" ");
  }

  get wildcardDotDecimal(){
    return int2ip(this.invertedDecimal); 
  }

  get wildHexMask() {
    var ihex_mask = this.invertedDecimal.toString(16).toUpperCase();
    ihex_mask = ihex_mask.padStart(8, '0')
    return ihex_mask.match(/.{1,2}/g).join(" ");
  }

  get wildBinMask() {
    var bm = this.invertedDecimal.toString(2);
    return bm.padStart(32, '0').match(/.{1,8}/g).join(" ");
  }


  get decimalMask(){
    // return (-1 << (32 - this.prefix_length)) >>> 0;  
    return (-1 << (32 - this.prefix_length) ) >>> 0;
  }

  get invertedDecimal(){
    return ~this.decimalMask; 
  }

  static getPrefixLength(cidr_prefix){
    if (cidr_prefix.startsWith('/')){
      var m = cidr_prefix.match(/\/(\d\d?)/);
      if (!m){
        // invalid netmask 
        let msg = 'Invalid netmask';
        console.error(msg); 
        this.errback(msg);
        return 
      }
      return  m[1]; 
    }
  }

  isValidPrefix(prefix) {
    return 1 <= prefix && prefix <= 32; 
  }

}


function ip2int(ip) {

  return ip.split('.').reduce(
    function(ipInt, octet) { 
      return (ipInt<<8) + parseInt(octet, 10)
    }, 0
    ) >>> 0;

}

function int2ip (ipDec) {
  return `${ipDec >>> 24}.${ipDec >> 16 & 255}.${ipDec >> 8 & 255}.${ipDec & 255}`; 
}

