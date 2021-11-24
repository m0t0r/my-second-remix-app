import {useLoaderData, Link} from 'remix'
import type {Joke} from '@prisma/client'
import type {LoaderFunction} from 'remix'
import {db} from '~/utils/db.server'

type LoaderData = {joke: Joke}

export const loader: LoaderFunction = async ({params: {jokeId}}) => {
  const joke = await db.joke.findUnique({where: {id: jokeId}})

  if (!joke) {
    throw Error('Joke not found')
  }

  const data: LoaderData = {joke}
  return data
}

function JokeRoute() {
  const data = useLoaderData<LoaderData>()
  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{data.joke.content}</p>
      <Link to=".">{data.joke.name} Permalink</Link>
    </div>
  )
}
export default JokeRoute
