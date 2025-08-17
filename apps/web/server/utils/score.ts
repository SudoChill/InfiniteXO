const teamScores: Record<'X'|'O', number> = { X: 0, O: 0 }

export function incrementTeamScore(team: 'X'|'O', delta = 1) {
  teamScores[team] += delta
  return { ...teamScores }
}

export function getTeamScores() {
  return { ...teamScores }
}


