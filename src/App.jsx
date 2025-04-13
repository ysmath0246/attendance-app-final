import React, { useEffect, useState } from 'react'
import { db } from './firebase'
import { getDocs, doc, updateDoc, getDoc, collection } from 'firebase/firestore'
import './index.css'

export default function AttendanceApp() {
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const fetchStudents = async () => {
      const snapshot = await getDocs(collection(db, 'students'))
      const allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const todayStudents = allStudents.filter(s =>
        (s.lessons || []).some(lesson => lesson.date === today)
      )
      setStudents(todayStudents)
    }

    const fetchAttendance = async () => {
      const docRef = doc(db, 'attendance', today)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setAttendance(docSnap.data())
      }
    }

    fetchStudents()
    fetchAttendance()
  }, [])

  const handleCheck = async (name) => {
    const newAttendance = { ...attendance, [name]: new Date().toLocaleTimeString() }
    await updateDoc(doc(db, 'attendance', today), newAttendance)
    setAttendance(newAttendance)
  }

  const groupedByTime = students.reduce((acc, s) => {
    s.lessons.forEach(lesson => {
      if (lesson.date === today) {
        if (!acc[lesson.time]) acc[lesson.time] = []
        acc[lesson.time].push(s)
      }
    })
    return acc
  }, {})

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-xs">
          <h2 className="text-xl font-bold mb-4 text-center">출석 시스템 로그인</h2>
          <input
            type="password"
            placeholder="비밀번호 입력"
            className="border w-full p-2 rounded mb-4"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
            onClick={() => {
              if (password === '1234') {
                setLoggedIn(true)
              } else {
                alert('비밀번호가 틀렸습니다!')
              }
            }}
          >
            로그인
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">{today} 출석 체크</h1>
      {Object.entries(groupedByTime).map(([time, group]) => (
        <div key={time} className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">{time} 수업</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {group.map(student => (
              <div
                key={student.id}
                className={`border rounded-2xl p-4 cursor-pointer transition shadow-sm hover:shadow-md text-center ${attendance[student.name] ? 'bg-green-100' : 'bg-white'}`}
                onClick={() => handleCheck(student.name)}
              >
                <p className="text-lg font-bold">{student.name}</p>
                <p className="text-sm text-gray-500">{student.birth}</p>
                {attendance[student.name] && (
                  <p className="text-green-600 text-sm mt-2">출석 완료</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}