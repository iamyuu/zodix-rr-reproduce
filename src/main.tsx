import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
	createBrowserRouter,
	RouterProvider,
	Form,
	useNavigation,
	useActionData,
	type ActionFunctionArgs,
} from 'react-router-dom';
import { z } from 'zod';
import { zx } from 'zodix';

const schema = z.object({
	name: z.string(),
	email: z.string().email(),
});

function save(formData: z.infer<typeof schema>) {
	console.debug(`🚀 ~ save ~ formData`, formData);
}

async function action({ request }: ActionFunctionArgs) {
	try {
		const formData = await zx.parseForm(request, schema);

		save(formData);

		return formData;
	} catch (error) {
		return error;
	}
}

function App() {
	const navigation = useNavigation();
	const actionData = useActionData();

	return (
		<Form method='post' action='/' style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
			<label style={{ display: 'flex', gap: 6 }}>
				<span>Name</span>
				<input type='text' name='name' />
			</label>

			<label style={{ display: 'flex', gap: 6 }}>
				<span>Email</span>
				<input type='text' name='email' />
			</label>

			<div>
				<button disabled={navigation.state === 'submitting'} type='submit'>
					Submit
				</button>
			</div>

			<pre>{JSON.stringify(actionData, null, 2)}</pre>
		</Form>
	);
}

const router = createBrowserRouter([
	{
		path: '/',
		action,
		element: <App />,
	},
]);

createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>,
);
