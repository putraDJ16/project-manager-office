import { projectsMock } from './projects';
import { usersMock } from './users';
import { tasksMock } from './tasks';

// Export all mocks from a single convenient wrapper
export const mockDatabase = {
  projects: projectsMock,
  users: usersMock,
  tasks: tasksMock
};

export { projectsMock, usersMock, tasksMock };
