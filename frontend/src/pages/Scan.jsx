import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../lib/api';
import { Search, Camera } from 'lucide-react';

export default function Scan() {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  const startScanner = async () => {
    try {
      setScanning(true);
      setError('');
      scannerRef.current = new Html5Qrcode('scanner-container');
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scannerRef.current.stop();
          setScanning(false);
          const code = decodedText.split('/').pop();
          buscarEquipo(code);
        },
        () => {}
      );
    } catch (err) {
      setError('Error al iniciar la cámara: ' + err.message);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      setScanning(false);
    }
  };

  const buscarEquipo = async (codigo) => {
    try {
      const equipo = await api.equipos.scan(codigo);
      setResultado(equipo);
    } catch {
      setError('Equipo no encontrado');
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualCode.trim()) buscarEquipo(manualCode.trim());
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Escanear QR</h1>

      <form onSubmit={handleManualSearch} className="flex gap-2">
        <input
          type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value)}
          placeholder="O ingresa código manualmente..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Search className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center">
        {!scanning ? (
          <button onClick={startScanner}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
            <Camera className="w-5 h-5" /> Escanear QR
          </button>
        ) : (
          <button onClick={stopScanner}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium">
            Detener Escáner
          </button>
        )}
      </div>

      <div id="scanner-container" className={`${scanning ? 'block' : 'hidden'} w-full max-w-sm mx-auto`} />

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {resultado && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-lg">{resultado.CodEquipo}</h2>
          <div className="text-sm space-y-1 text-gray-600">
            <p><strong>Tipo:</strong> {resultado.DesTipodeEquipo}</p>
            <p><strong>Estado:</strong> {resultado.Estado}</p>
            {resultado.asignacion && (
              <>
                <p><strong>Asignado a:</strong> {resultado.asignacion.TrabajadorNombre}</p>
                <p><strong>Área:</strong> {resultado.asignacion.AreaName}</p>
              </>
            )}
          </div>
          <button onClick={() => navigate(`/equipos/${resultado.IdMaeEquipo}`)}
            className="w-full py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">
            Ver Detalle Completo
          </button>
        </div>
      )}
    </div>
  );
}
