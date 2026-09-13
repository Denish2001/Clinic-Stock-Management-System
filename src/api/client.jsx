import axios from 'axios'; // axios is a tool for making http requests instead of using fetch we use axios eg fetch('https://dummyjson.com/products')


const API_BASE = 'https://dummyjson.com'; //simply stores the address of the API

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
}); //custom Axios instance, so that later you can write apiClient.get('./products') instead of axios.get('https://dummyjson.com/products')


// Request interceptor: add token, inteceptors get to look at requsts before they are sent
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); //browser has local storage where the app stores the login token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      //If it exists, inject it into the request headers
    }
    return config;
    //Return the modified config so the request can proceed
  },
  (error) => Promise.reject(error) //"Something went wrong while preparing the request. Pass the error along."
);


// Response interceptor: token refresh

//Waiting room manager incase of multiple refresh requests after token expires
let isRefreshing = false;
let failedQueue = []; //When requests fail with a 401 while a refresh is already happening, they get shoved into this array to wait patiently.

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error); // If the refresh failed, fail everyone in line
    } else {
      prom.resolve(token); // If we got the new token, give it to everyone in line!
    }
  });
  failedQueue = []; // Clear out the waiting room so it's empty for next time
};

// Response interceptor: token refresh incase of error
apiClient.interceptors.response.use(
  (response) => response, //If the request succeeds, just pass the data through normally
  async (error) => { //If the server sends back an error catch it instead of crashing the app
    const originalRequest = error.config; //When an Axios request fails, Axios automatically bundles up a "blueprint" or receipt of that request and stores it inside error.config. 
    //This receipt contains everything: the URL you tried to visit (e.g., /user), whether it was a GET or POST, the headers you sent, and any data attached.

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } 
      catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } 
      finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
/*
                 REACT APP
                       │
                       ▼
                 apiClient
                       │
                       ▼
             REQUEST INTERCEPTOR
                       │
              "Do I have a token?"
                       │
                       ▼
             Add Bearer token
                       │
                       ▼
                    API
                       │
             ┌─────────┴─────────┐
             │                   │
          Success               401
             │                   │
             ▼                   ▼
        Return data       Is token expired?
                                 │
                                 ▼
                         Use refresh token
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                 Success                    Failure
                    │                         │
                    ▼                         ▼
             Get new token               Delete tokens
                    │                         │
                    ▼                         ▼
             Retry request               Go to /login
                    │
                    ▼
                 API
                    │
                    ▼
                Return data
              
                */