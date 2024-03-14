import './App.css';
import { X509 } from 'jsrsasign';
import { useState, useEffect } from 'react';
import moment from 'moment';

interface CertificateInfo {
	name: string;
	cn: string;
	from: string;
	to: string;
}

const App: React.FC = () => {
	const [certificateInfo, setCertificateInfo] = useState<CertificateInfo | null>(null);
	const storedCertData = localStorage.getItem('cert');
	const initialCertificates: CertificateInfo[] | null = storedCertData ? JSON.parse(storedCertData) : null;
	const [certificates, setCertificates] = useState<CertificateInfo[] | null>(initialCertificates);


	useEffect(() => {
		if (certificates) {
			localStorage.setItem('cert', JSON.stringify(certificates));
		}
	}, [certificates]);

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const certData = await file.arrayBuffer();
		try {
			parseCertificate(certData);
		} catch (error) {
			console.error('Виникла помилка при обробці сертифіката:', error);
			alert('Неправильний формат або пошкоджений файл!');
		}
	};

	const parseCertificate = (certificateData: ArrayBuffer) => {
		const cert = new X509();
		cert.readCertHex(certHex(certificateData));

		const name = cert.getSubject().array[1][0].value;
		const cn = cert.getSubject().array[2][0].value;
		const from = cert.getNotBefore();
		const to = cert.getNotAfter();

		const certificateInfo = { name, cn, from, to };

		setCertificateInfo(certificateInfo);
		if (!certificates) {
			setCertificates([certificateInfo]);
		} else {
			const isNameUnique = !certificates.some(cert => cert.name === name);
			if (isNameUnique) {
				setCertificates(state => state ? [...state, certificateInfo] : [certificateInfo]);
			}
		}
	};

	const certHex = (certArrayBuffer: ArrayBuffer) => {
		const certArray = new Uint8Array(certArrayBuffer);
		return Array.prototype.map.call(certArray, byte => {
			return ('0' + (byte & 0xFF).toString(16)).slice(-2);
		}).join('');
	};

	const formatDate = (dateString: string) => {
		const date = moment(dateString, 'YYMMDDHHmmssZ');
		return date.format('DD MMMM YYYY, HH:mm:ss UTC');
	};

	const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const file = event.dataTransfer.files[0];
		const certData = await file.arrayBuffer();
		try {
			parseCertificate(certData);
		} catch (error) {
			console.error('Виникла помилка при обробці сертифіката:', error);
			alert('Неправильний формат або пошкоджений файл!');
		}
	};

	return (
		<>
			<div className="main-box">
				<div className="left">
					<button onClick={() => setCertificateInfo(null)} className="mn-button">Додати</button>
					<div className="list">
						{certificates ? (
							certificates.map(c => (
								<button key={c.name} onClick={() => setCertificateInfo(c)} className='lists'>
									{c.name}
								</button>
							))
						) : (
							<p>Нема жодного сертифікату</p>
						)}
					</div>
				</div>
				<div className={`right ${certificateInfo ? 'active' : ''}`}
					onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e)}
				>
					{certificateInfo ? (
						<>
							<p><b>Common Name:</b> <i className="namem">{certificateInfo.name}</i></p>
							<p><b>Issuer CN:</b> {certificateInfo.cn}</p>
							<p><b>Valid From:</b> {formatDate(certificateInfo.from)}</p>
							<p><b>Valid To:</b> {formatDate(certificateInfo.to)}</p>
						</>)
						: (
							<div className='center'>
								<input onChange={handleFileSelect} type="file" className='fileInput' />
								<div className="dropArea">
									Перетягніть файли сюди
								</div>
							</div>
						)}
				</div>
			</div>
		</>
	);
};

export default App;
