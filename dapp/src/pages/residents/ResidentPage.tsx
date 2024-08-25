import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar";
import SwitchInput from "../../components/SwitchInput";
import { addResident, doLogout, getResident, isManager, isResident, Profile, Resident, setCounselor } from "../../services/Web3Service";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import { ethers } from "ethers";
import { addApiResident, ApiResident, getApiResident, updateApiResident } from "../../services/APIService";

function ResidentPage() {

  let { wallet } = useParams();
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<number>(0);
  const [resident, setResident] = useState<Resident>({} as Resident);
  const [apiResident, setApiResident] = useState<ApiResident>({} as ApiResident);
  const navigate = useNavigate();

  useEffect(() => {
    if (isResident()) {
      doLogout()
      navigate('/');
    }
    if (wallet) {
      setIsLoading(2);
      getResident(wallet)
        .then(resident => {
          const { wallet, isCounselor, isManager, residence, nextPayment } = resident;
          setResident({ wallet, isCounselor, isManager, residence, nextPayment })
          setIsLoading(prevState => prevState - 1);
        })
        .catch(err => {
          setMessage(err.message)
          setIsLoading(0);
        });
      getApiResident(wallet)
        .then(apiResident => {
          setApiResident(apiResident)
          setIsLoading(prevState => prevState - 1);
        })
        .catch(err => {
          setMessage(err.message)
          setIsLoading(0);
        });
    }
  }, [])

  function onResidentChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = evt.target;
    setResident(prevState => ({ ...prevState, [id]: value }));
  }

  function onApiResidentChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = evt.target;
    setApiResident(prevState => ({ ...prevState, [id]: value }));
  }

  function btnSaveClick() {
    if (resident) {
      setMessage("Connecting to wallet...wait...");
      if (!wallet) {
        const promiseOnChain = addResident(resident.wallet, resident.residence);
        const promiseOffChain = addApiResident({ ...apiResident, profile: Profile.RESIDENT, wallet: resident.wallet });
        Promise.all([promiseOnChain, promiseOffChain])
          .then(results => navigate(`/residents?tx=${results[0].hash}`))
          .catch(err => setMessage(err.message))
      }
      else {
        const profile = resident.isCounselor ? Profile.COUNSELOR : Profile.RESIDENT
        const promises = []
        if (apiResident.profile != profile) {
          promises.push(setCounselor(resident.wallet, resident.isCounselor))
        }
        promises.push(updateApiResident(wallet, { ...apiResident, profile, wallet }))
        Promise.all(promises)
          .then(results => navigate(`/residents?tx=${wallet}`))
          .catch(err => setMessage(err.message))
      }
    }
  }

  function getNextPaymentInMilliseconds(): number | null {
    return resident.nextPayment ? ethers.toNumber(resident.nextPayment) * 1000 : null;
  }

  function getNextPayment(): string {
    const dateMs = getNextPaymentInMilliseconds();
    return !dateMs ? "Never paid" : new Date(dateMs).toDateString();
  }

  function getNextPaymentClass(): string {
    let className = "input-group input-group-outline";
    const dateMs = getNextPaymentInMilliseconds();
    if (!dateMs || dateMs < Date.now()) return className + ' is-invalid';
    return className + ' is-valid';
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
                      <i className="material-icons opacity-10 me-2">group</i>
                      {wallet ? "Edit" : "New"} Resident
                    </h6>
                  </div>
                </div>
                <div className="card-body px-0 pb-2">
                  {
                    isLoading > 0 ? <Loader /> : <></>
                  }
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="wallet">Wallet Address:</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="text" id="wallet"
                            value={resident.wallet || ""}
                            placeholder="0x00..."
                            onChange={onResidentChange}
                            disabled={!!wallet}></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="residence">Residence Id (block+apartment):</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="number" id="residence"
                            value={resident.residence || ""}
                            placeholder="1101"
                            onChange={onResidentChange}
                            disabled={!!wallet}></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="text" id="name"
                            value={apiResident.name || ""}
                            placeholder="Jhon Doe"
                            onChange={onApiResidentChange}
                          ></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="phone">Phone:</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="tel" id="phone"
                            value={apiResident.phone || ""}
                            placeholder="+5563999999999"
                            onChange={onApiResidentChange}
                          ></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="email" id="email"
                            value={apiResident.email || ""}
                            placeholder="jhondoe@example.com"
                            onChange={onApiResidentChange}
                          ></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  {
                    wallet ? (
                      <div className="row ms-3">
                        <div className="col-md-6 mb-3">
                          <div className="form-group">
                            <label htmlFor="nextPayment">Next Payment:</label>
                            <div className={getNextPaymentClass()} >
                              <input className="form-control" type="text" id="nextPayment"
                                value={getNextPayment()}
                                disabled={true}></input>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : <></>
                  }
                  {
                    isManager() && wallet ? (
                      <div className="row ms-3">
                        <div className="col-md-6 mb-3">
                          <div className="form-group">
                            <SwitchInput
                              id="isCounselor"
                              isChecked={resident.isCounselor}
                              text="Is Counselor?"
                              onChange={onResidentChange} />
                          </div>
                        </div>
                      </div>
                    ) : <></>
                  }
                  <div className="row ms-3">
                    <div className="col-md-12 mb-3">
                      <button className="btn bg-gradient-dark me-2" onClick={btnSaveClick}>
                        <i className="material-icons opacity-10 me-2">save</i>
                        Save Resident
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

export default ResidentPage;