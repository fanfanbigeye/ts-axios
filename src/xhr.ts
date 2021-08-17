import { resolve } from 'dns'
import { creatError } from './helpers/error'
import { parseHeaders } from './helpers/headers'
import { AxiosRequestConfig, AxiosResponse } from './types/index'

export default function xhr(config: AxiosRequestConfig) {
  return new Promise((resolve, reject) => {
    const { data = null, url, method = 'get', headers, responseType, timeout } = config

    const request = new XMLHttpRequest()

    function handleResponse(response: AxiosResponse) {
      if (response.status >= 200 && response.status < 300) {
        resolve(response)
      } else {
        const error = creatError(
          `Request failed with status code ${response.status}`,
          config,
          null,
          request,
          response
        )
        reject(error)
      }
    }

    if (responseType) {
      request.responseType = responseType
    }

    if (timeout) {
      request.timeout = timeout
    }

    request.onreadystatechange = function handleLoad() {
      if (request.readyState !== 4) {
        return
      }

      if (request.status === 0) {
        return
      }

      const responseHeaders = parseHeaders(request.getAllResponseHeaders())
      const responseData =
        responseType && responseType !== 'text' ? request.response : request.responseText
      const response: AxiosResponse = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      }
      handleResponse(response)
    }

    request.onerror = function handleError() {
      const error = creatError('Network Error', config, null, request)
      reject(error)
    }

    request.ontimeout = function handleTimeout() {
      const error = creatError(`Timeout of ${timeout} ms exceeded`, config, 'ECONNABORTED', request)
      reject(error)
    }

    request.open(method.toUpperCase(), url, true)

    Object.keys(headers).forEach(name => {
      if (data === null && name.toLowerCase() === 'content-type') {
        delete headers[name]
      } else {
        request.setRequestHeader(name, headers[name])
      }
    })

    request.send(data)
  })
}
