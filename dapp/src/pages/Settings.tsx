import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar"
import { getAddress, getBalance, upgrade } from "../services/Web3Service";
import Footer from "../components/Footer";
import Loader from "../components/Loader";

function Settings() {
  const [contract, setContract] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState<string>("");

  useEffect(() => {
    setIsLoading(true);
    getAddress()
      .then(address => {
        setContract(address);
        return getBalance();
      })
      .then(balance => {
        setBalance(balance);
        setIsLoading(false);
      })
      .catch(err => {
        setMessage(err.message);
        setIsLoading(false);
      });
  }, [])

  function btnSaveClick() {
    setMessage("Saving data...wait...");
    upgrade(contract)
      .then(tx => setMessage("Settings saved! It may takes some minutes to have effect."))
      .catch(err => setMessage(err.message));
  }

  return (
    <>
      <Sidebar />
      <main className="main-content position-relative max-height-vh-100 h-100 border-radius-lg ">
        <div className="container-fluid py-4">
          <div className="row">
            <div className="col-12">
              <div className="card my-4">
                <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
                  <div className="bg-gradient-primary shadow-primary border-radius-lg pt-4 pb-3">
                    <h6 className="text-white text-capitalize ps-3">
                      <i className="material-icons opacity-10 me-2">settings</i>
                      Settings
                    </h6>
                  </div>
                </div>
                <div className="card-body px-0 pb-2">
                  {
                    isLoading ? <Loader /> : <></>
                  }
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="balance">Condominium Balance (ETH):</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="number" id="balance" value={balance} disabled={true}></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="adapter">Adapter Address:</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="text" id="adapter" value={process.env.REACT_APP_ADAPTER_ADDRESS} disabled={true}></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="contract">Contract Address:</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="text" id="contract" value={contract} onChange={evt => setContract(evt.target.value)}></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-12 mb-3">
                      <button className="btn bg-gradient-dark me-2" onClick={btnSaveClick}>
                        <i className="material-icons opacity-10 me-2">save</i>
                        Save Settings
                      </button>
                      <span className="text-danger">{message}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </main >
    </>
  )
}

export default Settings;