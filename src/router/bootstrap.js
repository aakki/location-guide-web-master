import store from '../store'
import api from '../api'
import tokens from '@/data/tokens'

const elemLoading = document.getElementById('loading')

function hideLoading() {
  elemLoading.style.display = 'none'
}
setTimeout(hideLoading, 100)

export default bootstrap
