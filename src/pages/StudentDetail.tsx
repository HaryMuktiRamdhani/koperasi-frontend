import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit3, GraduationCap } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import PageHeader from "../components/PageHeader";

interface StudentData {
  id: string;
  nis: string;
  name: string;
  classId: string;
  jurusanId: string;
  generation: string;
  status: string;
  Class?: { name: string; level: string; academicYear: string };
  Jurusan?: { nama: string; kode: string };
}

function InfoItem({
  label,
  value,
  full = false,
}: {
  label: string;
  value?: string | null;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[#102a43] dark:text-slate-100">
        {value || "-"}
      </dd>
    </div>
  );
}

function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api
      .get<StudentData>(`/students/${id}`)
      .then((response) => setStudent(response.data))
      .catch(() => setError("Detail siswa gagal dimuat."))
      .finally(() => setLoading(false));
  }, [id]);

  const initials = useMemo(
    () =>
      student?.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "S",
    [student?.name],
  );

  if (loading)
    return (
      <p className="py-12 text-center text-sm text-slate-500 dark:text-[#a7b4c7]">
        Memuat detail siswa...
      </p>
    );
  if (!student)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        {error || "Siswa tidak ditemukan."}
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Siswa"
        description="Informasi lengkap siswa dari data koperasi sekolah."
        icon={GraduationCap}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/students")}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#168b87] hover:text-[#102a43] dark:hover:text-[#5eead4]"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar siswa
        </button>
        <Link
          to={`/students?edit=${student.id}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13716d]"
        >
          <Edit3 className="h-4 w-4" /> Edit siswa
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-[0_4px_18px_rgba(16,42,67,0.04)] dark:border-[#263449] dark:bg-[#111c2e]">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-[#e8f7f5] text-3xl font-semibold text-[#168b87] dark:bg-[#164e63] dark:text-[#5eead4]">
              {initials}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#102a43] dark:text-slate-100">
              {student.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
              {student.Jurusan?.nama || "Siswa"}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {student.status}
            </span>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)] dark:border-[#263449] dark:bg-[#111c2e]">
            <h2 className="text-base font-semibold text-[#102a43] dark:text-slate-100">
              Informasi Singkat
            </h2>
            <dl className="mt-4 space-y-4">
              <InfoItem label="NIS" value={student.nis} />
              <InfoItem label="Angkatan" value={student.generation} />
              <InfoItem label="Kelas" value={student.Class?.name} />
              <InfoItem label="Jurusan" value={student.Jurusan?.nama} />
            </dl>
          </section>
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)] dark:border-[#263449] dark:bg-[#111c2e] sm:p-8">
          <div className="border-b border-slate-200 pb-5 dark:border-[#263449]">
            <h2 className="text-lg font-semibold text-[#102a43] dark:text-slate-100">
              Informasi Siswa
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
              Data yang tersedia pada sistem saat ini.
            </p>
          </div>
          <dl className="grid gap-x-6 gap-y-6 pt-6 sm:grid-cols-2">
            <InfoItem label="Nama lengkap" value={student.name} />
            <InfoItem label="NIS" value={student.nis} />
            <InfoItem label="NISN" />
            <InfoItem label="Email" />
            <InfoItem label="Jenis kelamin" />
            <InfoItem label="Nomor telepon" />
            <InfoItem label="Tempat lahir" />
            <InfoItem label="Tanggal lahir" />
            <InfoItem label="Kelas" value={student.Class?.name} />
            <InfoItem label="Jurusan" value={student.Jurusan?.nama} />
            <InfoItem label="Angkatan" value={student.generation} />
            <InfoItem label="Status" value={student.status} />
            <InfoItem label="Alamat" full />
          </dl>
        </section>
      </div>
    </div>
  );
}

export default StudentDetail;
