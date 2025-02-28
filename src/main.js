import './theme.css'
import './style.css'
import { listenForUpdates } from './firebase'

// Function to update the UI
const updateDOM = (data) => {
  data.forEach((item) => {
      console.log(JSON.stringify(item));
  });
};

// Start listening for Firebase updates
listenForUpdates(updateDOM);
