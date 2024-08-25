import { useNavigate } from "react-router-dom";
import { doLogin } from "../services/Web3Service";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>("")
  function btnLoginClick() {
    setMessage("Logging in...")
    doLogin()
      .then(result => { navigate('/topics') })
      .catch(err => setMessage(err.message))
  }
  return (
    <main className="main-content  mt-0">
      <div className="page-header align-items-start min-vh-100" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=1984&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>
        <span className="mask bg-gradient-dark opacity-6"></span>
        <div className="container my-auto">
          <div className="row">
            <div className="col-lg-4 col-md-8 col-12 mx-auto">
              <div className="card z-index-0 fadeIn3 fadeInBottom">
                <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
                  <div className="bg-gradient-primary shadow-primary border-radius-lg py-3 pe-1">
                    <h4 className="text-white font-weight-bolder text-center mt-2 mb-0">Condominum DAO</h4>
                  </div>
                </div>
                <div className="card-body">
                  <form role="form" className="text-start">
                    <div className="text-center">
                      <img src="/logo192.png" alt="Condominium Logo" />
                    </div>
                    <div className="text-center">
                      <button type="button" className="btn bg-gradient-primary w-100 my-4 mb-2" onClick={btnLoginClick}>
                        <img src="/assets/metamask.svg" alt="Metamask Logo" width="48" className="me-2" />
                        Sign in with Metamask</button>
                    </div>
                    <p className="mt-4 text-sm text-center text-danger">
                      {message}
                    </p>
                    <p className="mt-4 text-sm text-center">
                      Don't have an account? Ask to the
                      <a href="mailto:email@example.com" className="text-primary text-gradient font-weight-bold ms-2">manager</a>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
