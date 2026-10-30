const FormStatus = ({ err, ok }) => <>{err && <p className="err" role="alert">{err}</p>}{ok && <p className="okmsg" role="status">{ok}</p>}</>;

export default FormStatus;
