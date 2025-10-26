import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastController() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}      
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      pauseOnHover
      draggable
      toastStyle={{
        backgroundColor: "#4C2D2D",
        color: "#EFEAE6",
        fontWeight: 600,
      }}
    />
  );
}
