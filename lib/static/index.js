import Dev from './dev'
import Pro from './pro'

const Static = process.env.NODE_ENV === 'development' ? Dev : Pro

export default Static