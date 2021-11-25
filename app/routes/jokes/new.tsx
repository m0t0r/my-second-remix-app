import {redirect, useActionData, useCatch, Link, Form} from 'remix'
import type {ActionFunction, LoaderFunction} from 'remix'
import {db} from '~/utils/db.server'
import {requireUserId, getUserId} from '~/utils/session.server'

function validateLength(value: string, length: number, field: string) {
  if (value.length < length) {
    return `${field} is too short`
  }
}

type ActionData = {
  formError?: string
  fieldErrors?: {
    name: string | undefined
    content: string | undefined
  }
  fields?: {
    name: string
    content: string
  }
}

export const loader: LoaderFunction = async ({request}) => {
  let userId = await getUserId(request)
  if (!userId) {
    throw new Response('Unauthorized', {status: 401})
  }
  return {}
}

export const action: ActionFunction = async ({request}): Promise<Response | ActionData> => {
  let userId = await requireUserId(request)

  if (!userId) {
    return redirect('/login?redirectTo=/jokes/new')
  }

  const form = await request.formData()
  const name = form.get('name')
  const content = form.get('content')

  if (typeof name !== 'string' || typeof content !== 'string') {
    return {formError: 'Invalid joke'}
  }
  const fieldErrors = {
    name: validateLength(name, 3, 'Name'),
    content: validateLength(content, 10, 'Joke'),
  }

  const fields = {name, content}

  if (Object.values(fieldErrors).some(Boolean)) {
    return {fieldErrors, fields}
  }

  const joke = await db.joke.create({data: {...fields, jokesterId: userId}})
  return redirect(`/jokes/${joke.id}`)
}

function NewJokeRoute() {
  const actionData = useActionData<ActionData>()

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <Form method="post">
        <div>
          <label>
            Name:{' '}
            <input
              type="text"
              defaultValue={actionData?.fields?.name}
              name="name"
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-describedby={actionData?.fieldErrors?.name ? 'name-error' : undefined}
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{' '}
            <textarea
              defaultValue={actionData?.fields?.content}
              name="content"
              aria-invalid={Boolean(actionData?.fieldErrors?.content) || undefined}
              aria-describedby={actionData?.fieldErrors?.content ? 'content-error' : undefined}
            />
          </label>
          {actionData?.fieldErrors?.content ? (
            <p className="form-validation-error" role="alert" id="content-error">
              {actionData.fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </div>
  )
}

export function CatchBoundary() {
  let caught = useCatch()

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a joke.</p>
        <Link to="/login">Login</Link>
      </div>
    )
  }
}

export function ErrorBoundary() {
  return <div className="error-container">Something unexpected went wrong. Sorry about that.</div>
}

export default NewJokeRoute
