import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar"
import { getAddress, getQuota, getResident, payQuota, Resident, upgrade } from "../services/Web3Service";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import { ethers } from "ethers";

function Quota() {
  const [resident, setResident] = useState<Resident>({} as Resident);
  const [quota, setQuota] = useState<ethers.BigNumberish>(ethers.toBigInt(0));
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    const quotaPromise = getQuota()
    const residentPromise = getResident(localStorage.getItem("account") || "");
    Promise.all([quotaPromise, residentPromise])
      .then(result => {
        setQuota(result[0])
        setResident(result[1])
        setIsLoading(false);
      })
      .catch(err => {
        setMessage(err.message)
        setIsLoading(false);
      });
  }, [])

  function btnPayQuotaClick() {
    setIsLoading(true);
    setMessage("Connecting to Metamask... wait...");
    payQuota(resident.residence, quota)
      .then(tx => {
        setMessage("Quota payed! It may takes some minutes to have effect.")
        setIsLoading(false);
      })
      .catch(err => {
        setMessage(err.message)
        setIsLoading(false);
      });
  }

  function getDate(timestamp: ethers.BigNumberish | undefined): string {
    return timestamp
      ? new Date(ethers.toNumber(timestamp) * 1000).toDateString()
      : "Never Payed";
  }

  function getNextPaymentInMilliseconds(): number | null {
    return resident.nextPayment ? ethers.toNumber(resident.nextPayment) * 1000 : null;
  }

  function getNextPaymentClass() {
    let className = "input-group input-group-outline";
    const dateMs = getNextPaymentInMilliseconds();
    if (!dateMs || dateMs < Date.now()) return className + ' is-invalid';
    return className + ' is-valid';
  }

  function shouldPay(): boolean {
    const dateMs = getNextPaymentInMilliseconds();
    return (!dateMs || dateMs <= Date.now());
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
                      <i className="material-icons opacity-10 me-2">payments</i>
                      Quota
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
                        <label htmlFor="quota">Monthly Quota (ETH):</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="number" id="quota" value={ethers.formatEther(quota)} disabled={true}></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="residenceId">Residence (block+apt):</label>
                        <div className="input-group input-group-outline">
                          <input className="form-control" type="number" id="residenceId" value={ethers.toNumber(resident.residence || 0)} disabled={true}></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="nextpayment">Next Payment:</label>
                        <div className={getNextPaymentClass()}>
                          <input className="form-control" type="text" id="nextpayment" value={getDate(resident.nextPayment)} disabled={true}></input>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row ms-3">
                    <div className="col-md-12 mb-3">
                      {
                        shouldPay()
                          ? (
                            <button className="btn bg-gradient-dark me-2" onClick={btnPayQuotaClick}>
                              <i className="material-icons opacity-10 me-2">save</i>
                              Pay Quota
                            </button>
                          ) : <></>
                      }
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

export default Quota;