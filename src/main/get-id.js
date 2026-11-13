const os = require('os')
const crypto = require('crypto')

const mac = Object.values(os.networkInterfaces())
  .flat()
  .find((i) => !i.internal && i.mac !== '00:00:00:00:00:00')?.mac || 'unknown'
const cpu = os.cpus()[0]?.model || 'cpu'
const id = crypto.createHash('md5').update(mac + cpu).digest('hex').substring(0, 12).toUpperCase()
console.log('YOUR MACHINE ID:', id)